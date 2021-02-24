import { YAMLMap } from 'yaml/types';
import { DictionaryOf, Paths, Settings, StringOrStrings } from '../metadata-format';
import { getOrCreateMap, getStrings, setStrings } from '../util/yaml';
import { Dictionary, proxyDictionary } from './KeyedNode';


export class SettingsNode extends Dictionary<any> implements Settings {
  /** @internal */
  constructor(node: YAMLMap) {
    super(node);
  }

  #paths!: Paths;
  get paths(): Paths {
    return this.#paths || (this.#paths = <Paths><unknown>proxyDictionary(getOrCreateMap(this.node, 'paths'), (m, p) => getStrings(m, p), setStrings));
  }

  #tools!: DictionaryOf<string>;
  get tools(): DictionaryOf<string> {
    return this.#tools || (this.#tools = proxyDictionary(getOrCreateMap(this.node, 'tools'), (m, p) => m.get(p), (m, p, v) => m.set(p, v)));
  }

  #variables!: DictionaryOf<StringOrStrings>;
  get variables(): DictionaryOf<StringOrStrings> {
    return this.#variables || (this.#variables = proxyDictionary<StringOrStrings>(getOrCreateMap(this.node, 'variables'), getStrings, setStrings));
  }

  #defines!: DictionaryOf<string>;
  get defines(): DictionaryOf<string> {
    return this.#defines || (this.#defines = proxyDictionary(getOrCreateMap(this.node, 'defines'), (m, p) => m.get(p), (m, p, v) => m.set(p, v)));
  }
}
