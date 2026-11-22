import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Newsreader_400Regular, Newsreader_400Regular_Italic, Newsreader_500Medium } from '@expo-google-fonts/newsreader';
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { StoreProvider, useStore } from '../state/store';
import { colors } from '../ui/theme';
import { lang } from '../i18n';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Root() {
  const { ready } = useStore();
  const [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_500Medium,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
  });
  const show = ready && fontsLoaded;

  useEffect(() => {
    if (show) SplashScreen.hideAsync().catch(() => {});
  }, [show]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.documentElement.lang = lang;
  }, []);

  if (!show) return null;
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      />
    </>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider style={{ backgroundColor: colors.bg }}>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
