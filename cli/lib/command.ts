// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { i } from '@microsoft/cella.core';
import { dim } from 'chalk';
import { Argument } from './argument';
import { CommandLine, Help } from './command-line';
import { blank, cli } from './constants';
import { Switch } from './switch';

/** @internal */

export abstract class Command implements Help {
  readonly abstract command: string;
  readonly abstract argumentsHelp: Array<string>;

  readonly switches = new Array<Switch>();
  readonly arguments = new Array<Argument>();

  readonly abstract seeAlso: Array<Help>;
  readonly abstract aliases: Array<string>;

  abstract get summary(): string;
  abstract get description(): Array<string>;

  get synopsis(): Array<string> {
    return [
      i`## Synopsis`,
      ` \`${cli} ${this.command} ${this.arguments.map(each => `<${each.argument}>`).join(' ')}\`${this.switches.flatMap(each => dim(`[--${each.switch}]`)).join(' ')}`,
    ];
  }

  get title() {
    return `${cli} ${this.command}`;
  }

  constructor(public commandLine: CommandLine) {
    commandLine.addCommand(this);
  }

  get inputs() {
    return this.commandLine.inputs.slice(1);
  }

  get help() {
    return [
      i`### \`${this.title}\``,
      this.summary,
      blank,
      ...this.synopsis,
      blank,
      i`## Description`,
      ...this.description,
      ...this.argumentsHelp,
      ...(this.switches.length ? [
        i`## Switches`,
        ...this.switches.flatMap(each => ` \`--${each.switch}\`: ${each.help.join(' ')}`)
      ] : []),
      ...(this.seeAlso.length ? [
        i`## See Also`,
        ...this.seeAlso.flatMap(each => each.title)
      ] : []),
    ];
  }

  async run() {
    // do something
    return true;
  }

}
