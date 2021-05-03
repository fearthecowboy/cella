/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Context, Environment, i, intersect } from '@microsoft/cella.core';
import { strict } from 'assert';
import { tmpdir } from 'os';
import { join } from 'path';
import { Command } from './command';

export type switches = {
  [key: string]: Array<string>;
}

export interface Help {
  readonly help: Array<string>;
  readonly title: string;
}

function createContext(cmdline: CommandLine): Context {
  return <any>intersect(new Ctx(cmdline), cmdline.switches);
}
class Ctx {
  constructor(cmdline: CommandLine) {
    this.os =
      cmdline.switches['windows'] ? 'win32' :
        cmdline.switches['osx'] ? 'darwin' :
          cmdline.switches['linux'] ? 'linux' :
            cmdline.switches['freebsd'] ? 'freebsd' :
              process.platform;
    this.arch = cmdline.switches['x64'] ? 'x64' :
      cmdline.switches['x86'] ? 'x32' :
        cmdline.switches['arm'] ? 'arm' :
          cmdline.switches['arm64'] ? 'arm64' :
            process.arch;
  }

  readonly os: string;
  readonly arch: string;

  get windows(): boolean {
    return this.os === 'win32';
  }

  get linux(): boolean {
    return this.os === 'linux';
  }

  get freebsd(): boolean {
    return this.os === 'freebsd';
  }

  get osx(): boolean {
    return this.os === 'darwin';
  }

  get x64(): boolean {
    return this.arch === 'x64';
  }

  get x86(): boolean {
    return this.arch === 'x32';
  }

  get arm(): boolean {
    return this.arch === 'arm';
  }

  get arm64(): boolean {
    return this.arch === 'arm64';
  }
}

export class CommandLine {
  readonly commands = new Array<Command>();
  readonly inputs = new Array<string>();
  readonly switches: switches = {};
  readonly context = intersect(new Ctx(this), this.switches);

  #home?: string;
  get cella_home() {
    // home folder is determined by
    // command line (--cella-home, --cella_home)
    // environment (CELLA_HOME)
    // default 1 $HOME/.cella
    // default 2 <tmpdir>/.cella

    // note, this does not create the folder, that would happen when the session is initialized.

    return this.#home || (this.#home = this.switches['cella-home']?.[0] || this.switches['cella_home']?.[0] || process.env['CELLA_HOME'] || join(process.env['HOME'] || tmpdir(), '.cella'));
  }

  get repositoryFolder() {
    return this.switches['repo']?.[0] || this.switches['repository']?.[0] || undefined;
  }

  get force() {
    return !!this.switches['force'];
  }

  #githubAuthToken?: string;
  get githubAuthToken() {
    return this.#githubAuthToken || (this.#githubAuthToken = this.switches['github_auth_token']?.[0] || this.switches['github-auth-token']?.[0] || process.env['github-auth-token'] || process.env['github_auth_token'] || '');
  }

  get debug() {
    return !!this.switches['debug'];
  }

  get language() {
    const l = this.switches['language'] || [];
    strict.ok(l?.length || 0 < 2, i`Expected a single value for '--${'language'}' -- found multiple.`);
    return l[0] || Intl.DateTimeFormat().resolvedOptions().locale;
  }

  #environment?: Environment;
  get environment(): Environment {
    return this.#environment || (this.#environment = intersect(this, process.env, ['constructor', 'environment']));
  }

  claim(sw: string) {
    const v = this.switches[sw];
    delete this.switches[sw];
    return v;
  }

  addCommand(command: Command) {
    this.commands.push(command);
  }

  /** parses the command line and returns the command that has been requested */
  get command() {
    return this.commands.find(each => each.command === this.inputs[0]);
  }
}

export function parseArgs(args: Array<string>) {
  const cli = new CommandLine();

  for (const each of args) {
    // --name
    // --name:value
    // --name=value
    const [, name, value] = /^--([^=:]+)[=:]?(.+)?$/g.exec(each) || [];
    if (name) {
      cli.switches[name] = cli.switches[name] === undefined ? [] : cli.switches[name];
      cli.switches[name].push(value);
      continue;
    }

    cli.inputs.push(each);
  }
  return cli;
}
