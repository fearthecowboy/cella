/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Artifact, i } from '@microsoft/cella.core';
import { fail } from 'assert';
import { MultiBar, SingleBar } from 'cli-progress';
import { error } from 'console';
import { session } from '../../main';
import { Command } from '../command';
import { Table } from '../markdown-table';
import { formatName, log, warning } from '../styling';
import { GithubAuthToken } from '../switches/auth';
import { Repo } from '../switches/repo';
import { Version } from '../switches/version';
import { UpdateCommand } from './update';

export class AcquireCommand extends Command {
  readonly command = 'acquire';
  seeAlso = [];
  argumentsHelp = [];
  repo = new Repo(this);
  ghAuth = new GithubAuthToken(this);
  version = new Version(this)

  get summary() {
    return i`Acquire artifacts in the repository.`;
  }

  get description() {
    return [
      i`This allows the consumer to acquire (download and unpack) artifacts. Artifacts must be activated to be used.`,
    ];
  }

  async run() {
    const repository = session.getSource('default');
    try {
      await repository.load();
    } catch (e) {
      // try to update the repo
      if (!await UpdateCommand.update(repository)) {
        return false;
      }
    }

    const versions = this.version.values;
    if (versions.length && this.inputs.length !== versions.length) {
      error(i`Multiple packages specified, but not an equal number of '--verison=' switches. `);
      return false;
    }

    let failing = false;

    const artifacts = new Array<Artifact>();

    let n = 0;
    for (const each of this.inputs) {
      const version = versions[n++];

      // resolve the shortnames to full names
      const query = repository.where.id.nameOrShortNameIs(each);
      if (version) {
        query.version.rangeMatch(version);
      }

      const manifests = query.items;

      switch (manifests.length) {
        case 0:
          // did not match a name or short name.
          error(i`Artifact identity '${each}' could not be found.`);
          failing = true; // we're not going to install, but might as well tell the user if there are other errors.
          continue;

        case 1:
          // found the artifact. awesome.
          artifacts.push(await repository.openArtifact(manifests[0]));
          // artifacts.push([...linq.values((await repository.open(manifests))).selectMany(each => each)]);
          break;

        default:
          // too many matches. This should not happen.
          fail(i`Artifact identity '${each}' matched more than one result. This should never happen.`);
          break;
      }
    }

    if (artifacts.length) {
      const table = new Table('Artifact', 'Version', 'Summary');
      for (const artifact of artifacts) {
        const latest = artifact;
        const name = formatName(latest.info.id, latest.shortName);
        table.push(name, latest.info.version, latest.info.summary || '');
      }
      log(table.toString());
    }

    log();

    if (failing) {
      warning('No artifacts are being acquired.');
      return false;
    }

    // resolve the full set of artifacts to install.

    const bar = new MultiBar({
      clearOnComplete: true, hideCursor: true, format: '{action} {bar}\u25A0 {percentage}% {name} | ETA: {eta}s | {value}/{total}',
      barCompleteChar: '\u25A0',
      barIncompleteChar: ' ',
      etaBuffer: 40
    });
    let dl: SingleBar | undefined;
    let p: SingleBar | undefined;

    for (const artifact of artifacts) {
      await artifact.install({
        download: (name, percent) => {

          if (percent >= 100) {
            if (dl) {
              dl.update(percent);
              // bar.remove(dl);
            }
            dl = undefined;
            return;
          }
          if (percent) {
            if (!dl) {
              dl = bar.create(100, 0, { action: 'downloading', name: name });
            }
            dl.update(percent);
          }
        },
        progress: (percent: number) => {
          if (percent >= 100) {
            if (p) {
              p.update(percent);
              // bar.remove(p);
            }
            p = undefined;
            return;
          }
          if (percent) {
            if (!p) {
              p = bar.create(100, 0, { action: 'unpacking', name: artifact.id });
            }
            p.update(percent);
          }
        }
      });
    }
    bar.stop();
    console.log('success?');
    return true;
  }
}