/**
 * Login Screen
 * User authentication screen
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../styles/themes';
import { SPACING, BORDER_RADIUS } from '../../styles/themes';
import { H2, Body1, Caption } from '../../components/common/Typography';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAuthStore } from '@store/index';

export const LoginScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { login, isLoading } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid email or password');
    }
  };

  const handleSignUp = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.BACKGROUND_SECONDARY }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <H2 style={[styles.title, { color: theme.TEXT }]}>
            Welcome Back
          </H2>
          <Body1 style={[styles.subtitle, { color: theme.TEXT_SECONDARY }]}>
            Sign in to your RapidTriage account
          </Body1>
        </View>

        {/* Login Form */}
        <Card style={styles.formCard} padding="LG">
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Caption style={[styles.inputLabel, { color: theme.TEXT_SECONDARY }]}>
                EMAIL ADDRESS
              </Caption>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.BACKGROUND_TERTIARY,
                  borderColor: theme.BORDER_PRIMARY,
                  color: theme.TEXT 
                }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={theme.TEXT_TERTIARY}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Caption style={[styles.inputLabel, { color: theme.TEXT_SECONDARY }]}>
                PASSWORD
              </Caption>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.BACKGROUND_TERTIARY,
                  borderColor: theme.BORDER_PRIMARY,
                  color: theme.TEXT 
                }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={theme.TEXT_TERTIARY}
                secureTextEntry
              />
            </View>

            {/* Forgot Password Link */}
            <Button
              title="Forgot Password?"
              onPress={handleForgotPassword}
              variant="ghost"
              size="small"
              style={styles.forgotPasswordButton}
            />

            {/* Login Button */}
            <Button
              title="Sign In"
              onPress={handleLogin}
              variant="primary"
              size="large"
              fullWidth
              loading={isLoading}
              style={styles.loginButton}
            />
          </View>
        </Card>

        {/* Sign Up Section */}
        <View style={styles.signUpSection}>
          <Body1 style={[styles.signUpText, { color: theme.TEXT_SECONDARY }]}>
            Don't have an account?
          </Body1>
          <Button
            title="Sign Up"
            onPress={handleSignUp}
            variant="outline"
            size="large"
            fullWidth
            style={styles.signUpButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.LG,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.XL,
  },
  title: {
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  formCard: {
    marginBottom: SPACING.LG,
  },
  form: {
    // Form styles handled by children
  },
  inputContainer: {
    marginBottom: SPACING.LG,
  },
  inputLabel: {
    marginBottom: SPACING.SM,
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    fontSize: 16,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.LG,
  },
  loginButton: {
    // Login button styles handled by Button component
  },
  signUpSection: {
    alignItems: 'center',
  },
  signUpText: {
    marginBottom: SPACING.MD,
  },
  signUpButton: {
    // Sign up button styles handled by Button component
  },
});