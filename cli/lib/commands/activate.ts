// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { i } from '@microsoft/cella.core';
import { Command } from '../command';

export class ActivateCommand extends Command {
  readonly command = 'activate';
  readonly aliases = [];
  seeAlso = [];
  argumentsHelp = [];

  get summary() {
    return i`Activates the tools required for a project.`;
  }

  get description() {
    return [
      i`This allows the consumer to Activate the tools required for a project. If the tools are not already installed, this will force them to be downloaded and installed before activation.`,
    ];
  }

  async run() {

    return true;
  }
}