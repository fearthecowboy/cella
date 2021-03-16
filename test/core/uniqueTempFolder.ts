/*---------------------------------------------------------------------------------------------
 *  Copyright 2021 (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';

export function uniqueTempFolder(): string {
  return mkdtempSync(`${tmpdir()}/cella-temp$`);
}
