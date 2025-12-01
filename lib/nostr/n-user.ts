import type { NostrSigner, NPool } from "@nostrify/nostrify";

import { NBrowserSigner, NConnectSigner, NSecSigner } from "@nostrify/nostrify";
import { nip19 } from "nostr-tools";

import type { NLoginBunker, NLoginExtension } from "./n-login.ts";

/** Represents a Nostr user with authentication credentials. */
export class NUser {
  constructor(
    /** The authentication method used for this user */
    readonly method: "bunker" | "extension" | `x-${string}`,
    /** The public key of the user in hex format. */
    readonly pubkey: string,
    /** The signer that can sign events on behalf of this user. */
    readonly signer: NostrSigner,
  ) {}

  static fromBunkerLogin(login: NLoginBunker, pool: NPool): NUser {
    const clientSk = nip19.decode(login.data.clientNsec) as { type: "nsec"; data: Uint8Array };
    const clientSigner = new NSecSigner(clientSk.data);

    return new NUser(
      login.type,
      login.pubkey,
      new NConnectSigner({
        relay: pool.group([...login.data.relays]),
        pubkey: login.pubkey,
        signer: clientSigner,
        timeout: 60_000,
      }),
    );
  }

  static fromExtensionLogin(login: NLoginExtension): NUser {
    return new NUser(
      login.type,
      login.pubkey,
      new NBrowserSigner(),
    );
  }
}
