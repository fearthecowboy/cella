// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { FileType } from '../../lib/fs/filesystem';
import { i } from '../../lib/i18n';
import { Uri } from '../../lib/util/uri';
import { session } from '../../main';
import { resolvePath } from '../command-line';
import { projectFile } from '../format';
import { error } from '../styling';
import { Switch } from '../switch';

export class Project extends Switch {
  switch = 'project';
  get help() {
    return [
      i`override the path to the project folder`
    ];
  }

  async getProjectFolder() {
    const v = resolvePath(super.value);
    if (v) {
      const uri = session.fileSystem.file(v);
      const stat = await uri.stat();

      if (stat.type & FileType.File) {
        return uri;
      }
      if (stat.type & FileType.Directory) {
        const project = await session.findProjectProfile(uri, false);
        if (project) {
          return project;
        }
      }
      error(i`Unable to find project environment ${projectFile(uri)}`);
      return undefined;
    }
    return session.findProjectProfile();
  }

  override get value(): Promise<Uri | undefined> {
    return this.getProjectFolder();
  }
}