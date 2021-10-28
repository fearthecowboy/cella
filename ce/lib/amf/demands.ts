// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { isMap, isSeq, Scalar, YAMLMap, YAMLSeq } from 'yaml';
import { ErrorKind } from '../interfaces/error-kind';
import { Demands } from '../interfaces/metadata/demands';
import { Settings } from '../interfaces/metadata/Settings';
import { ValidationError } from '../interfaces/validation-error';
import { ObjectDictionary } from '../yaml/ImplMapOf';
import { ParentNode } from '../yaml/yaml-node';
import { YamlObject } from '../yaml/YamlObject';
import { Installs } from './installer';
import { Requires } from './Requires';
import { SettingsNode } from './settings';

const hostFeatures = new Set<string>(['x64', 'x86', 'arm', 'arm64', 'windows', 'linux', 'osx', 'freebsd']);

export class DemandNode extends YamlObject implements Demands {

  /* Demands */
  settings: Settings = new SettingsNode(this);
  requires = new Requires(this);
  seeAlso = new Requires(this, 'seeAlso');
  install = new Installs(this);

  get error(): string | undefined {
    return <string>this.selfNode.get('error');
  }
  set error(errorMessage: string | undefined) {
    this.selfNode.set('error', errorMessage);
  }

  get warning(): string | undefined {
    return <string>this.self?.get('warning');
  }
  set warning(warningMessage: string | undefined) {
    this.selfNode.set('warning', warningMessage);
  }

  get message(): string | undefined {
    return <string>this.self?.get('message');
  }
  set message(message: string | undefined) {
    this.selfNode.set('message', message);
  }

  /** @internal */
  override *validate(): Iterable<ValidationError> {
    yield* super.validate();
    if (this.self) {
      yield* this.settings.validate();
      yield* this.requires.validate();
      yield* this.seeAlso.validate();
      yield* this.install.validate();
    }
  }
}


export class ConditionalDemands extends ObjectDictionary<Demands> {
  constructor(parent: ParentNode, nodeName: string) {
    super(parent, nodeName, (k, v) => new DemandNode(this, k));
  }

  /** @internal */
  override *validate(): Iterable<ValidationError> {
    for (const each of this.members) {
      const n = <YAMLSeq | YAMLMap | Scalar>each.key;
      if (!isMap(each.value) && !isSeq(each.value)) {

        yield {
          message: `Conditional Demand ${each.key} is not an object`,
          range: n.range || [0, 0, 0],
          category: ErrorKind.IncorrectType
        };
      }
    }

    for (const demand of this.values) {
      yield* demand.validate();
    }
  }
}