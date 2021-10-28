// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { StringsSequence } from '../../../yaml/strings';
import { Validation } from '../../validation';

export interface Registry {
  readonly kind: string;
}

export interface ArtifactRegistry extends Registry, Validation {
  /** the uri to the artifact source location */
  readonly location: StringsSequence;
}
