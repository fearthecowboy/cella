/*---------------------------------------------------------------------------------------------
 *  Copyright 2021 (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { join } from 'path';
import { URI } from 'vscode-uri';
import { UriComponents } from 'vscode-uri/lib/umd/uri';
import { FileSystem } from './filesystem';

/**
 * This class is intended to be a drop-in replacement for the vscode uri
 * class, but has a filesystem associated with it.
 *
 * By associating the filesystem with the URI, we can allow for file URIs
 * to be scoped to a given filesystem (ie, a zip could be a filesystem )
 *
 * Uniform Resource Identifier (URI) http://tools.ietf.org/html/rfc3986.
 * This class is a simple parser which creates the basic component parts
 * (http://tools.ietf.org/html/rfc3986#section-3) with minimal validation
 * and encoding.
 *
 *
 * ```txt
 *       foo://example.com:8042/over/there?name=ferret#nose
 *       \_/   \______________/\_________/ \_________/ \__/
 *        |           |            |            |        |
 *     scheme     authority       path        query   fragment
 *        |   _____________________|__
 *       / \ /                        \
 *       urn:example:animal:ferret:nose
 * ```
 *
 */
export class Uri implements URI {
  protected constructor(public readonly fileSystem: FileSystem, protected readonly uri: URI) {

  }

  /**
  * scheme is the 'http' part of 'http://www.msft.com/some/path?query#fragment'.
  * The part before the first colon.
  */
  get scheme() { return this.uri.scheme; }

  /**
  * authority is the 'www.msft.com' part of 'http://www.msft.com/some/path?query#fragment'.
  * The part between the first double slashes and the next slash.
  */
  get authority() { return this.uri.authority; }

  /**
   * path is the '/some/path' part of 'http://www.msft.com/some/path?query#fragment'.
   */
  get path() { return this.uri.path; }

  /**
   * query is the 'query' part of 'http://www.msft.com/some/path?query#fragment'.
   */
  get query() { return this.uri.query; }

  /**
   * fragment is the 'fragment' part of 'http://www.msft.com/some/path?query#fragment'.
   */
  get fragment() { return this.uri.fragment; }

  /**
  * Creates a new URI from a string, e.g. `http://www.msft.com/some/path`,
  * `file:///usr/home`, or `scheme:with/path`.
  *
  * @param value A string which represents an URI (see `URI#toString`).
  */
  static parse(fileSystem: FileSystem, value: string, _strict?: boolean): Uri {
    return new Uri(fileSystem, URI.parse(value, _strict));
  }

  /**
 * Creates a new URI from a file system path, e.g. `c:\my\files`,
 * `/usr/home`, or `\\server\share\some\path`.
 *
 * The *difference* between `URI#parse` and `URI#file` is that the latter treats the argument
 * as path, not as stringified-uri. E.g. `URI.file(path)` is **not the same as**
 * `URI.parse('file://' + path)` because the path might contain characters that are
 * interpreted (# and ?). See the following sample:
 * ```ts
const good = URI.file('/coding/c#/project1');
good.scheme === 'file';
good.path === '/coding/c#/project1';
good.fragment === '';
const bad = URI.parse('file://' + '/coding/c#/project1');
bad.scheme === 'file';
bad.path === '/coding/c'; // path is now broken
bad.fragment === '/project1';
```
 *
 * @param path A file system path (see `URI#fsPath`)
 */
  static file(fileSystem: FileSystem, path: string): Uri {
    return new Uri(fileSystem, URI.file(path));
  }

  /** construct an Uri from the various parts */
  static from(fileSystem: FileSystem, components: {
    scheme: string;
    authority?: string;
    path?: string;
    query?: string;
    fragment?: string;
  }): Uri {
    return new Uri(fileSystem, URI.from(components));
  }

  /**
   * Join all arguments together and normalize the resulting Uri.
   *
   * Also ensures that slashes are all forward.
   * */
  join(...paths: Array<string>) {
    return new Uri(this.fileSystem, this.with({ path: join(this.path, ...paths).replace(/\\/g, '/') }));
  }

  /**
   * Returns a string representing the corresponding file system path of this URI.
   * Will handle UNC paths, normalizes windows drive letters to lower-case, and uses the
   * platform specific path separator.
   *
   * * Will *not* validate the path for invalid characters and semantics.
   * * Will *not* look at the scheme of this URI.
   * * The result shall *not* be used for display purposes but for accessing a file on disk.
   *
   *
   * The *difference* to `URI#path` is the use of the platform specific separator and the handling
   * of UNC paths. See the below sample of a file-uri with an authority (UNC path).
   *
   * ```ts
      const u = URI.parse('file://server/c$/folder/file.txt')
      u.authority === 'server'
      u.path === '/shares/c$/file.txt'
      u.fsPath === '\\server\c$\folder\file.txt'
  ```
   *
   * Using `URI#path` to read a file (using fs-apis) would not be enough because parts of the path,
   * namely the server name, would be missing. Therefore `URI#fsPath` exists - it's sugar to ease working
   * with URIs that represent files on disk (`file` scheme).
   */
  get fsPath(): string {
    return this.uri.fsPath;
  }

  /** Duplicates the current Uri, changing out any parts */
  with(change: { scheme?: string | undefined; authority?: string | null | undefined; path?: string | null | undefined; query?: string | null | undefined; fragment?: string | null | undefined; }): URI {
    return new Uri(this.fileSystem, this.uri.with(change));
  }

  /**
  * Creates a string representation for this URI. It's guaranteed that calling
  * `URI.parse` with the result of this function creates an URI which is equal
  * to this URI.
  *
  * * The result shall *not* be used for display purposes but for externalization or transport.
  * * The result will be encoded using the percentage encoding and encoding happens mostly
  * ignore the scheme-specific encoding rules.
  *
  * @param skipEncoding Do not encode the result, default is `false`
  */
  toString(skipEncoding?: boolean): string {
    return this.uri.toString(skipEncoding);
  }

  /** returns a JSON object with the components of the Uri */
  toJSON(): UriComponents {
    return this.uri.toJSON();
  }
}