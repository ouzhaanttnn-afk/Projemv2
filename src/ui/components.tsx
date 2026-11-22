// Uygulamanın ortak ekran parçaları.
import { forwardRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ScrollViewInstance,
  type TextInputInstance,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { t, upper } from '../i18n';
import { colors, fonts, gutter, hairline, maxContentWidth, radius, type } from './theme';

// ------------------------------------------------------------------ Yazı

export function Kicker({ children, style, accent }: { children: string; style?: StyleProp<any>; accent?: boolean }) {
  return <Text style={[type.kicker, accent && { color: colors.accent }, style]}>{upper(children)}</Text>;
}

// ------------------------------------------------------------------ Ekran

type ScreenProps = {
  children: ReactNode;
  footer?: ReactNode;
  topBar?: ReactNode;
  scrollRef?: React.Ref<ScrollViewInstance>;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Screen({ children, footer, topBar, scrollRef, contentStyle, testID }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      testID={testID}
    >
      <View style={{ height: insets.top, backgroundColor: colors.bg }} />
      {topBar}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: footer ? 24 : 24 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={[styles.column, contentStyle]}>{children}</View>
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={[styles.column, styles.footerInner]}>{footer}</View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

/** Üst satır: solda geri, ortada (isteğe bağlı) başlık, sağda eylem. */
export function TopBar({ back = true, right, onBack }: { back?: boolean; right?: ReactNode; onBack?: () => void }) {
  return (
    <View style={styles.topBar}>
      <View style={[styles.column, styles.topBarInner]}>
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('back')}
            hitSlop={12}
            onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
            style={styles.backBtn}
          >
            <Chevron direction="left" size={9} />
            <Text style={styles.backText}>{t('back')}</Text>
          </Pressable>
        ) : (
          <View />
        )}
        {right ?? <View />}
      </View>
    </View>
  );
}

/** Adım göstergesi + başlık + giriş metni. */
export function StepHeader({ step, total = 5, title, intro }: { step: number; total?: number; title: string; intro?: string }) {
  return (
    <View style={styles.stepHeader}>
      <View style={styles.stepBars} accessibilityLabel={t('stepOf', { n: step, total })}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[styles.stepBar, i < step && styles.stepBarOn]} />
        ))}
      </View>
      <Kicker style={{ marginTop: 14 }}>{t('stepOf', { n: step, total })}</Kicker>
      <Text style={[type.title, { marginTop: 8 }]} accessibilityRole="header">
        {title}
      </Text>
      {intro ? <Text style={[type.bodyMuted, { marginTop: 8 }]}>{intro}</Text> : null}
    </View>
  );
}

export function Section({ title, hint, children, style, onLayout, testID }: { title: string; hint?: string; children: ReactNode; style?: StyleProp<ViewStyle>; onLayout?: (y: number) => void; testID?: string }) {
  return (
    <View style={[styles.section, style]} onLayout={onLayout ? (e) => onLayout(e.nativeEvent.layout.y) : undefined} testID={testID}>
      <View style={styles.sectionRule} />
      <Kicker>{title}</Kicker>
      {hint ? <Text style={[type.small, { marginTop: 6 }]}>{hint}</Text> : null}
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  );
}

// ------------------------------------------------------------------ Düğmeler

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'quiet';
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
  testID?: string;
  accessibilityLabel?: string;
};

export function Button({ label, onPress, variant = 'primary', disabled, busy, style, small, testID, accessibilityLabel }: ButtonProps) {
  const isDisabled = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!isDisabled, busy: !!busy }}
      disabled={isDisabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        variant === 'primary' && styles.btnPrimary,
        variant === 'primary' && pressed && { backgroundColor: colors.accentPressed },
        variant === 'secondary' && styles.btnSecondary,
        variant === 'secondary' && pressed && { backgroundColor: colors.sunken },
        variant === 'quiet' && styles.btnQuiet,
        variant === 'quiet' && pressed && { opacity: 0.6 },
        isDisabled && variant !== 'quiet' && styles.btnDisabled,
        isDisabled && variant === 'quiet' && { opacity: 0.4 },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={variant === 'primary' ? colors.onAccent : colors.ink} />
      ) : (
        <Text
          numberOfLines={1}
          style={[
            styles.btnText,
            small && styles.btnTextSmall,
            variant === 'primary' && { color: colors.onAccent },
            variant === 'quiet' && styles.btnQuietText,
            isDisabled && variant === 'primary' && { color: colors.surface },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** Küçük, yazı biçimli eylem (ör. "Kaldır", "Kapak yap"). */
export function TextAction({ label, onPress, tone = 'ink', disabled, testID, accessibilityLabel }: { label: string; onPress: () => void; tone?: 'ink' | 'muted' | 'accent'; disabled?: boolean; testID?: string; accessibilityLabel?: string }) {
  const color = tone === 'accent' ? colors.accent : tone === 'muted' ? colors.muted : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      testID={testID}
      style={({ pressed }) => [{ paddingVertical: 6, opacity: disabled ? 0.35 : pressed ? 0.55 : 1 }]}
    >
      <Text style={[styles.textAction, { color }]}>{label}</Text>
    </Pressable>
  );
}

/** Kenarlı kare simge düğmesi (sıralama okları). */
export function IconButton({ onPress, disabled, children, label, testID }: { onPress: () => void; disabled?: boolean; children: ReactNode; label: string; testID?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      testID={testID}
      style={({ pressed }) => [styles.iconBtn, pressed && { backgroundColor: colors.sunken }, disabled && { opacity: 0.3 }]}
    >
      {children}
    </Pressable>
  );
}

/** Kenarlıklarla çizilmiş ok; yazı tipine ya da simge paketine bağlı değil. */
export function Chevron({ direction, size = 8, color = colors.ink }: { direction: 'up' | 'down' | 'left' | 'right'; size?: number; color?: string }) {
  const rotate = { up: '45deg', right: '135deg', down: '225deg', left: '-45deg' }[direction];
  const offset = { up: { marginTop: size / 2.5 }, down: { marginBottom: size / 2.5 }, left: { marginLeft: size / 2.5 }, right: { marginRight: size / 2.5 } }[direction];
  return (
    <View
      style={[
        { width: size, height: size, borderLeftWidth: 1.5, borderTopWidth: 1.5, borderColor: color, transform: [{ rotate }] },
        offset,
      ]}
    />
  );
}

// ------------------------------------------------------------------ Alanlar

type FieldProps = TextInputProps & {
  label?: string;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
  counter?: boolean;
};

export const Field = forwardRef<TextInputInstance, FieldProps>(function Field(
  { label, hint, containerStyle, style, multiline, counter, maxLength, value, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ marginBottom: 14 }, containerStyle]}>
      {label ? (
        <View style={styles.fieldLabelRow}>
          <Text style={type.label}>{label}</Text>
          {counter && maxLength ? (
            <Text style={styles.counter}>
              {(value ?? '').length}/{maxLength}
            </Text>
          ) : null}
        </View>
      ) : null}
      <TextInput
        ref={ref}
        value={value}
        maxLength={maxLength}
        multiline={multiline}
        placeholderTextColor={colors.faint}
        selectionColor={colors.accent}
        cursorColor={colors.accent}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[styles.input, multiline && styles.inputMultiline, focused && styles.inputFocused, webNoOutline, style]}
        {...rest}
      />
      {hint ? <Text style={[type.small, { marginTop: 6 }]}>{hint}</Text> : null}
    </View>
  );
});

// ------------------------------------------------------------------ Görsel

export function Thumb({ uri, size = 64, ratio = 1, style }: { uri: string; size?: number; ratio?: number; style?: StyleProp<any> }) {
  return (
    <View style={[styles.thumb, { width: size, height: size * ratio }, style]}>
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
    </View>
  );
}

export function Rule({ strong, style }: { strong?: boolean; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: hairline, backgroundColor: strong ? colors.ruleStrong : colors.rule }, style]} />;
}

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.accent} />
      {label ? <Text style={[type.small, { marginTop: 10 }]}>{label}</Text> : null}
    </View>
  );
}

// Web'de tarayıcının mavi odak çerçevesi yerine kendi kenar rengimiz.
const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

// ------------------------------------------------------------------ Stiller

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: gutter, paddingTop: 8, flexGrow: 1 },
  column: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' },
  footer: {
    borderTopWidth: hairline,
    borderTopColor: colors.rule,
    backgroundColor: colors.bg,
    paddingTop: 12,
    paddingHorizontal: gutter,
  },
  footerInner: { gap: 8 },
  topBar: { paddingHorizontal: gutter, height: 48, justifyContent: 'center' },
  topBarInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingRight: 8 },
  backText: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
  stepHeader: { marginBottom: 20 },
  stepBars: { flexDirection: 'row', gap: 4 },
  stepBar: { flex: 1, height: 2, backgroundColor: colors.rule },
  stepBarOn: { backgroundColor: colors.ink },
  section: { marginTop: 22 },
  sectionRule: { height: hairline, backgroundColor: colors.ruleStrong, marginBottom: 10 },
  btn: {
    minHeight: 50,
    borderRadius: radius,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSmall: { minHeight: 38, paddingHorizontal: 12 },
  btnPrimary: { backgroundColor: colors.accent },
  btnSecondary: { borderWidth: hairline, borderColor: colors.ink, backgroundColor: 'transparent' },
  btnQuiet: { backgroundColor: 'transparent', minHeight: 40 },
  btnDisabled: { backgroundColor: colors.rule, borderColor: colors.rule },
  btnText: { fontFamily: fonts.sansMedium, fontSize: 16, color: colors.ink, letterSpacing: 0.1 },
  btnTextSmall: { fontSize: 14 },
  btnQuietText: { fontFamily: fonts.sans, textDecorationLine: 'underline', color: colors.ink, fontSize: 15 },
  textAction: { fontFamily: fonts.sansMedium, fontSize: 14 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius,
    borderWidth: hairline,
    borderColor: colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  counter: { fontFamily: fonts.sans, fontSize: 12, color: colors.faint, fontVariant: ['tabular-nums'] },
  input: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderWidth: hairline,
    borderColor: colors.rule,
    borderRadius: radius,
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 46,
  },
  inputMultiline: { minHeight: 92, textAlignVertical: 'top', paddingTop: 11 },
  inputFocused: { borderColor: colors.ink },
  thumb: { backgroundColor: colors.sunken, overflow: 'hidden', borderRadius: 2 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
});
