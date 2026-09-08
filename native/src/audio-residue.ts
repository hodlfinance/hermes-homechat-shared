// The audio this app writes to the device belongs to the account that was signed
// in: a synthesized reply holds what the assistant said, and a voice note holds
// the device owner's own recorded speech. Nothing else deletes either of them, so
// signing out has to.
//
// The file-system surface is taken as a parameter rather than imported, so that
// the clear can be exercised against real files under `node --test` instead of
// only being read as text.

export const speechAudioFilePrefix = "hey-hermes-speech-";

// expo-audio writes every voice note into a subdirectory of the cache directory it
// creates itself: "ExpoAudio" on iOS and "Audio" on Android, each holding files
// named "recording-<uuid>.<ext>". Both names are swept on both platforms, because
// the one that belongs to the other platform is simply missing.
export const voiceNoteDirectoryNames = ["ExpoAudio", "Audio"];
export const voiceNoteFilePrefix = "recording-";

export type AudioResidueFileSystem = {
  cacheDirectory: string | null;
  documentDirectory: string | null;
  readDirectoryAsync(directoryUri: string): Promise<string[]>;
  deleteAsync(fileUri: string, options?: { idempotent?: boolean }): Promise<void>;
};

export function speechAudioRoots(fileSystem: AudioResidueFileSystem) {
  return [fileSystem.cacheDirectory, fileSystem.documentDirectory].filter(
    (root): root is string => Boolean(root),
  );
}

// Returns the number of files it could not delete, so that a total failure is
// something the caller can see rather than something it has to assume did not
// happen. Signing out still finishes either way.
export async function clearAudioFilesIn(
  fileSystem: AudioResidueFileSystem,
  directoryUri: string,
  prefix: string,
) {
  let entries: string[];
  try {
    entries = await fileSystem.readDirectoryAsync(directoryUri);
  } catch {
    // A directory that is not there holds nothing to delete.
    return 0;
  }

  let undeleted = 0;
  for (const entry of entries) {
    if (!entry.startsWith(prefix)) continue;
    try {
      await fileSystem.deleteAsync(`${directoryUri}${entry}`, { idempotent: true });
    } catch {
      // One file that will not delete must not take the rest of them with it.
      undeleted += 1;
    }
  }
  return undeleted;
}

export async function clearStoredAudioResidue(
  fileSystem: AudioResidueFileSystem,
  voiceNoteUri: string | null,
) {
  let undeleted = 0;

  for (const root of speechAudioRoots(fileSystem)) {
    undeleted += await clearAudioFilesIn(fileSystem, root, speechAudioFilePrefix);
  }

  const cacheRoot = fileSystem.cacheDirectory;
  if (cacheRoot) {
    for (const directoryName of voiceNoteDirectoryNames) {
      // The files inside the directory, never the directory itself: on iOS a
      // prepare that passes no options reuses the recorder built at mount, and
      // that recorder cannot write into a directory that no longer exists.
      undeleted += await clearAudioFilesIn(
        fileSystem,
        `${cacheRoot}${directoryName}/`,
        voiceNoteFilePrefix,
      );
    }
  }

  if (voiceNoteUri) {
    try {
      await fileSystem.deleteAsync(voiceNoteUri, { idempotent: true });
    } catch {
      // The recorder names its file before anyone records into it, so this is a
      // failure to delete something that may never have existed.
      undeleted += 1;
    }
  }

  return undeleted;
}
