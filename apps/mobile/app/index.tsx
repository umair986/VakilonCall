import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Button, Icon, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";

WebBrowser.maybeCompleteAuthSession();
import { radius, spacing, typography } from "../utils/theme";
import { useAuthStore } from "../stores/authStore";
import { useTokenStore } from "../stores/tokenStore";
import { api } from "../services/api";
import type { LanguageCode } from "@vakiloncall/shared";

const palette = {
  white: "#FFFFFF",
  black: "#000000",
  ink: "#111111",
  muted: "#6B6B6B",
  line: "#E4E4E4",
  faint: "#F7F7F7",
  danger: "#B42318",
};

const GOOGLE_WEB_CLIENT_ID =
  (Constants.expoConfig?.extra as Record<string, string> | undefined)
    ?.GOOGLE_WEB_CLIENT_ID ?? "";
const GOOGLE_ANDROID_CLIENT_ID =
  (Constants.expoConfig?.extra as Record<string, string> | undefined)
    ?.GOOGLE_ANDROID_CLIENT_ID ?? "";
const GOOGLE_IOS_CLIENT_ID =
  (Constants.expoConfig?.extra as Record<string, string> | undefined)
    ?.GOOGLE_IOS_CLIENT_ID ?? "";

export default function LoginScreen(): React.JSX.Element {
  const router = useRouter();
  const { setTokens, setUser, setIsNewUser, setLoading } = useAuthStore();
  const { setBalance } = useTokenStore();
  const [message, setMessage] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (request?.redirectUri) {
      console.log('Redirect URI:', request.redirectUri);
    }
  }, [request?.redirectUri]);

  const handleGoogleResponse = useCallback(async () => {
    if (response?.type !== "success") return;

    const idToken = response.params.id_token;
    if (!idToken) {
      setMessage("Google sign-in failed — no ID token received.");
      setIsGoogleLoading(false);
      return;
    }

    setIsGoogleLoading(true);
    setLoading(true);
    setMessage("");

    try {
      const result = await api.googleLogin(idToken);

      if (result.success) {
        setTokens(result.data.access_token, result.data.refresh_token);

        if (result.data.is_new_user || !result.data.user) {
          setIsNewUser(true);
          router.replace("/role-select");
        } else {
          const userData = result.data.user;
          setUser({
            id: userData.id as string,
            phone: (userData.phone as string) ?? null,
            email: (userData.email as string) ?? null,
            google_id: (userData.google_id as string) ?? null,
            full_name: (userData.full_name as string) ?? null,
            role: userData.role as "user" | "lawyer",
            language_pref: (userData.language_pref as LanguageCode) ?? "en",
            token_balance: (userData.token_balance as number) ?? 0,
            is_active: true,
            is_banned: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          setBalance((userData.token_balance as number) ?? 0);
          router.replace(
            userData.role === "lawyer" ? "/lawyer-home" : "/home"
          );
        }
      } else {
        setMessage(result.error.message);
      }
    } catch {
      setMessage("Google sign-in failed. Please try again.");
    } finally {
      setIsGoogleLoading(false);
      setLoading(false);
    }
  }, [response, router, setTokens, setUser, setIsNewUser, setLoading, setBalance]);

  useEffect(() => {
    void handleGoogleResponse();
  }, [handleGoogleResponse]);

  const handleGoogle = useCallback((): void => {
    if (!GOOGLE_WEB_CLIENT_ID || GOOGLE_WEB_CLIENT_ID.includes("your-google")) {
      setMessage(
        "Google Client ID not configured. Update GOOGLE_WEB_CLIENT_ID in app.json."
      );
      return;
    }
    setMessage("");
    void promptAsync();
  }, [promptAsync]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.hero}>
        <View style={styles.logoMark}>
          <Icon source="scale-balance" color={palette.white} size={34} />
        </View>
        <Text style={styles.title}>Almost there</Text>
        <Text style={styles.subtitle}>Sign up or log in to continue.</Text>
        <Text style={styles.caption}>It only takes a minute.</Text>
      </View>

      <View style={styles.sheet}>
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={handleGoogle}
            icon="google"
            textColor={palette.black}
            style={[styles.authButton, styles.googleButton]}
            contentStyle={styles.authButtonContent}
            labelStyle={styles.authButtonLabel}
            loading={isGoogleLoading}
            disabled={isGoogleLoading || !request}
          >
            Continue with Google
          </Button>

          <Button
            mode="contained"
            onPress={() => router.push("/mobile-login")}
            icon="cellphone"
            buttonColor={palette.black}
            textColor={palette.white}
            style={styles.authButton}
            contentStyle={styles.authButtonContent}
            labelStyle={styles.authButtonLabel}
          >
            Continue with Mobile
          </Button>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.footer}>
          <Text style={styles.terms}>
            By continuing you agree to our Terms and Privacy Policy.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.black,
  },
  hero: {
    flex: 3,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    backgroundColor: palette.black,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: palette.white,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodySmall,
    color: "#E0E0E0",
    textAlign: "center",
  },
  caption: {
    ...typography.caption,
    color: palette.white,
    fontWeight: "700",
    textAlign: "center",
    marginTop: spacing.xs,
  },
  sheet: {
    flex: 7,
    backgroundColor: palette.faint,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    justifyContent: "space-between",
  },
  actions: {
    gap: spacing.md,
  },
  authButton: {
    borderRadius: radius.sm,
    borderColor: palette.line,
  },
  googleButton: {
    backgroundColor: palette.white,
  },
  authButtonContent: {
    minHeight: 52,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
  },
  authButtonLabel: {
    ...typography.button,
    flex: 1,
    textAlign: "left",
  },
  message: {
    ...typography.caption,
    color: palette.muted,
    textAlign: "center",
    marginTop: spacing.md,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: spacing.md,
  },
  terms: {
    ...typography.caption,
    color: palette.muted,
    textAlign: "center",
  },
});
