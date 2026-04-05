import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('=== [ERROR BOUNDARY] CAUGHT ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('=== [ERROR BOUNDARY] COMPONENT STACK ===');
    console.error(errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconWrap}>
              <Ionicons name="alert-circle" size={80} color="#f87171" />
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              The application encountered an unexpected error. This has been logged for our team.
            </Text>
            
            <View style={styles.errorBox}>
              <Text style={styles.errorText} numberOfLines={3}>
                {this.state.error?.message || 'Unknown internal error'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={this.handleRetry}
              style={styles.button}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
            
            <Text style={styles.footerText}>
              Platform: {Platform.OS} | App Version: 1.0.0
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 32 
  },
  iconWrap: {
    marginBottom: 24,
    shadowColor: '#f87171',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  title: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: { 
    fontSize: 15, 
    color: '#64748b', 
    marginBottom: 32, 
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  errorBox: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    width: '100%',
    marginBottom: 32,
  },
  errorText: { 
    fontSize: 13, 
    color: '#ef4444', 
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textAlign: 'center',
  },
  button: { 
    backgroundColor: '#005d90', 
    paddingHorizontal: 32, 
    paddingVertical: 16, 
    borderRadius: 18,
    shadowColor: '#005d90',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: { 
    color: 'white', 
    fontWeight: '800',
    fontSize: 16,
  },
  footerText: {
    position: 'absolute',
    bottom: 20,
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});

export default ErrorBoundary;
