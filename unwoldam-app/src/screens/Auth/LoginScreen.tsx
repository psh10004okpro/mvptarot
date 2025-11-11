import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { login, clearError } from '../../store/slices/authSlice';
import { Button, Input } from '../../components/common';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';
import { AuthNavigationProp } from '../../types/navigation';

interface LoginScreenProps {
  navigation: AuthNavigationProp<'Login'>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    // 검증
    setEmailError('');
    setPasswordError('');
    dispatch(clearError());

    let isValid = true;

    if (!email) {
      setEmailError('이메일을 입력해주세요.');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('올바른 이메일 형식이 아닙니다.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('비밀번호를 입력해주세요.');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('비밀번호는 8자 이상이어야 합니다.');
      isValid = false;
    }

    if (!isValid) return;

    try {
      await dispatch(login({ email: email.toLowerCase(), password })).unwrap();
      // 성공 시 자동으로 Main으로 이동 (AppNavigator에서 처리)
    } catch (err: any) {
      Alert.alert('로그인 실패', err || '로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>🌙 운월담 타로</Text>
          <Text style={styles.subtitle}>로그인하고 당신의 운명을 확인하세요</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="이메일"
            placeholder="이메일을 입력하세요"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            error={emailError}
          />

          <Input
            label="비밀번호"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon="lock-closed-outline"
            error={passwordError}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            title="로그인"
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
            style={styles.loginButton}
          />

          <Button
            title="회원가입"
            variant="outline"
            onPress={() => navigation.navigate('Register')}
            fullWidth
            style={styles.registerButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  loginButton: {
    marginTop: spacing.md,
  },
  registerButton: {
    marginTop: spacing.md,
  },
});

export default LoginScreen;
