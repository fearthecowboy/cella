// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { acquireArtifactFile, AcquireEvents, AcquireOptions, nuget } from '../fs/acquire';
import { OutputOptions, TarBzUnpacker, TarGzUnpacker, TarUnpacker, Unpacker, UnpackEvents, ZipUnpacker } from '../fs/archive';
import { Installer } from '../interfaces/Installer';
import { NupkgInstaller } from '../interfaces/nupkg-installer';
import { UnpackSettings } from '../interfaces/unpack-settings';
import { UnTarInstaller } from '../interfaces/untar-installer';
import { UnZipInstaller } from '../interfaces/unzip-installer';
import { Verifiable } from '../interfaces/verifiable';
import { Session } from '../session';
import { Uri } from '../util/uri';

export interface InstallArtifactInfo {
  readonly name: string;
  readonly targetLocation: Uri;
}

function artifactFileName(artifact: InstallArtifactInfo, install: Installer, extension: string): string {
  let result = artifact.name;
  if (install.nametag) {
    result += '-';
    result += install.nametag;
  }

  if (install.lang) {
    result += '-';
    result += install.lang;
  }

  result += extension;
  return result;
}

function applyAcquireOptions(options: AcquireOptions, install: Verifiable): AcquireOptions {
  if (install.sha256) {
    return { ...options, algorithm: 'sha256', value: install.sha256 };
  }
  if (install.sha512) {
    return { ...options, algorithm: 'sha512', value: install.sha512 };
  }

  return options;
}

function applyUnpackOptions(options: OutputOptions, install: UnpackSettings): OutputOptions {
  return { ...options, strip: install.strip, transform: [...install.transform] };
}

export async function installNuGet(session: Session, artifact: InstallArtifactInfo, install: NupkgInstaller, options: { events?: Partial<UnpackEvents & AcquireEvents> }): Promise<void> {
  const targetFile = `${artifact.name}.zip`;
  const file = await nuget(
    session,
    install.location,
    targetFile,
    applyAcquireOptions(options, install));
  return new ZipUnpacker(session).unpack(
    file,
    artifact.targetLocation,
    applyUnpackOptions(options, install));
}


async function acquireInstallArtifactFile(session: Session, targetFile: string, locations: Array<string>, options: AcquireOptions, install: Verifiable) {
  const file = await acquireArtifactFile(
    session,
    locations.map(each => session.fileSystem.parse(each)),
    targetFile,
    applyAcquireOptions(options, install));
  return file;
}

export async function installUnTar(session: Session, artifact: InstallArtifactInfo, install: UnTarInstaller, options: { events?: Partial<UnpackEvents & AcquireEvents> }): Promise<void> {
  const file = await acquireInstallArtifactFile(session, artifactFileName(artifact, install, '.tar'), install.location.toArray(), options, install);
  const x = await file.readBlock(0, 128);
  let unpacker: Unpacker;
  if (x[0] === 0x1f && x[1] === 0x8b) {
    unpacker = new TarGzUnpacker(session);
  } else if (x[0] === 66 && x[1] === 90) {
    unpacker = new TarBzUnpacker(session);
  } else {
    unpacker = new TarUnpacker(session);
  }

  return unpacker.unpack(file, artifact.targetLocation, applyUnpackOptions(options, install));
}

export async function installUnZip(session: Session, artifact: InstallArtifactInfo, install: UnZipInstaller, options: { events?: Partial<UnpackEvents & AcquireEvents> }): Promise<void> {
  const file = await acquireInstallArtifactFile(session, artifactFileName(artifact, install, '.zip'), install.location.toArray(), options, install);
  await new ZipUnpacker(session).unpack(
    file,
    artifact.targetLocation,
    applyUnpackOptions(options, install));
}
