import { NLogin } from "../../lib/nostr/n-login";

export function useLoginActions() {
  const { $nostr } = useNuxtApp();
  const { login: addLogin } = useNostrLogin();

  const bunker = async (uri: string) => {
    try {
      const login = await NLogin.fromBunker(uri, $nostr);
      addLogin(login);
    }
    catch (error) {
      throw new Error(`Failed to login with bunker: ${error}`);
    }
  };

  const extension = async () => {
    try {
      const login = await NLogin.fromExtension();
      addLogin(login);
    }
    catch (error) {
      throw new Error(`Failed to login with extension: ${error}`);
    }
  };

  return {
    bunker,
    extension,
  };
}
