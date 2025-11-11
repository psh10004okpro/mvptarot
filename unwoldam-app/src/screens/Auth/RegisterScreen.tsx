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
import { register, clearError } from '../../store/slices/authSlice';
import { Button, Input } from '../../components/common';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';
import { AuthNavigationProp } from '../../types/navigation';

interface RegisterScreenProps {
  navigation: AuthNavigationProp<'Register'>;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    // 검증
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    dispatch(clearError());

    let isValid = true;

    if (!name) {
      setNameError('이름을 입력해주세요.');
      isValid = false;
    } else if (name.length < 2) {
      setNameError('이름은 2자 이상이어야 합니다.');
      isValid = false;
    }

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

    if (!confirmPassword) {
      setConfirmPasswordError('비밀번호 확인을 입력해주세요.');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
      isValid = false;
    }

    if (!isValid) return;

    try {
      await dispatch(
        register({
          name,
          email: email.toLowerCase(),
          password,
        })
      ).unwrap();
      // 성공 시 자동으로 Main으로 이동
      Alert.alert('회원가입 완료', '운월담 타로에 오신 것을 환영합니다!');
    } catch (err: any) {
      Alert.alert('회원가입 실패', err || '회원가입에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>🌙 회원가입</Text>
          <Text style={styles.subtitle}>운월담 타로와 함께 시작하세요</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="이름"
            placeholder="이름을 입력하세요"
            value={name}
            onChangeText={setName}
            leftIcon="person-outline"
            error={nameError}
          />

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
            placeholder="비밀번호를 입력하세요 (8자 이상)"
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon="lock-closed-outline"
            error={passwordError}
          />

          <Input
            label="비밀번호 확인"
            placeholder="비밀번호를 다시 입력하세요"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            leftIcon="lock-closed-outline"
            error={confirmPasswordError}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            title="회원가입"
            onPress={handleRegister}
            loading={isLoading}
            fullWidth
            style={styles.registerButton}
          />

          <Button
            title="이미 계정이 있으신가요? 로그인"
            variant="ghost"
            onPress={() => navigation.navigate('Login')}
            fullWidth
            style={styles.loginButton}
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
  registerButton: {
    marginTop: spacing.md,
  },
  loginButton: {
    marginTop: spacing.sm,
  },
});

export default RegisterScreen;
