// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { StringsSequence } from '../../yaml/strings';
import { Validation } from '../validation';

/** A person/organization/etc who either has contributed or is connected to the artifact */

export interface Contact extends Validation {
  name: string;
  email?: string;

  readonly roles: StringsSequence;
}
