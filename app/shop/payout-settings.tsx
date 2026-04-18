import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { BackButton } from '@/components/ui/BackButton';
import { payoutApi } from '@/api/payoutApi';
import { thannigoPalette, roleAccent, roleSurface, roleGradients, Shadow, Spacing } from '@/constants/theme';

const SHOP_ACCENT = roleAccent.shop_owner;
const SHOP_SURF = roleSurface.shop_owner;

export default function PayoutSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [bankVerified, setBankVerified] = useState(false);
  const [upiVerified, setUpiVerified] = useState(false);
  const [payoutMode, setPayoutMode] = useState<'upi' | 'bank'>('bank');
  const [upiId, setUpiId] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [bankDetails, setBankDetails] = useState({ 
    account_number: '', 
    ifsc: '', 
    holder_name: '' 
  });
  const [pendingRequest, setPendingRequest] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await payoutApi.getWallet();
      if (res.status === 1) {
        const w = res.data;
        setPayoutMode(w.payout_mode || 'bank');
        setUpiId(w.upi_id || '');
        setBankVerified(!!w.bank_account_verified);
        setUpiVerified(!!w.upi_id_verified);
        setBankDetails({
          account_number: w.bank_account_no || '',
          ifsc: w.bank_ifsc || '',
          holder_name: w.account_holder_name || '',
        });
        setConfirmAccountNumber(w.bank_account_no || '');
      }

      // Check for pending bank requests
      const reqRes = await payoutApi.getBankRequestStatus();
      if (reqRes.status === 1) {
        setPendingRequest(reqRes.data);
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Load failed', text2: 'Please try again.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    // Basic validation
    if (payoutMode === 'bank') {
      if (!bankDetails.holder_name || !bankDetails.account_number || !bankDetails.ifsc) {
        Toast.show({ type: 'error', text1: 'Missing info', text2: 'Please fill all bank details.' });
        return;
      }
      if (bankDetails.account_number !== confirmAccountNumber) {
        Toast.show({ type: 'error', text1: 'Mismatch', text2: 'Account numbers do not match.' });
        return;
      }
    } else {
      if (!upiId) {
        Toast.show({ type: 'error', text1: 'Missing info', text2: 'Please enter your UPI ID.' });
        return;
      }
    }

    setIsSaving(true);
    try {
      if (payoutMode === 'bank') {
        // If bank details changed, create a request
        await payoutApi.requestBankChange({
          account_number: bankDetails.account_number,
          ifsc: bankDetails.ifsc,
          holder_name: bankDetails.holder_name,
        });
        Toast.show({ 
          type: 'success', 
          text1: 'Request Submitted', 
          text2: 'Bank change is pending admin approval.' 
        });
      } else {
        await payoutApi.updateSettings({
          payout_mode: payoutMode,
          upi_id: upiId,
          bank_details: bankDetails,
          payout_cycle: 'daily',
        });
        Toast.show({ type: 'success', text1: 'Saved', text2: 'Payment details updated.' });
      }
      
      // Refresh data instead of going back immediately to show pending status
      fetchData();
    } catch (err: any) {
      Toast.show({ 
        type: 'error', 
        text1: 'Update failed', 
        text2: err.message || 'Could not save settings.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      await payoutApi.verifyBank();
      Toast.show({ type: 'success', text1: 'Validation Success', text2: 'Bank account verified successfully.' });
      setBankVerified(true);
    } catch {
      Toast.show({ type: 'error', text1: 'Verification Failed', text2: 'Could not verify account. Please check details.' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyUpi = async () => {
    setIsVerifying(true);
    try {
      await payoutApi.verifyUpi();
      Toast.show({ type: 'success', text1: 'UPI Verified', text2: 'Your UPI ID has been verified.' });
      setUpiVerified(true);
    } catch {
      Toast.show({ type: 'error', text1: 'Verification Failed', text2: 'Could not verify UPI ID.' });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 }}>
          <BackButton fallback="/shop/earnings" />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Payout Details</Text>
            <Text style={styles.headerSub}>Manage how you receive money</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.notifBtnSub} 
          onPress={() => router.push('/notifications' as any)}
        >
          <Ionicons name="notifications-outline" size={22} color={SHOP_ACCENT} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <ActivityIndicator color={SHOP_ACCENT} size="large" style={{ marginTop: 100 }} />
        ) : (
          <View style={styles.formContainer}>
            {/* Mode Selection */}
            <Text style={styles.fieldLabel}>Transfer Method</Text>
            <View style={styles.modeToggle}>
              {(['bank', 'upi'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeBtn, payoutMode === mode && styles.modeBtnActive]}
                  onPress={() => setPayoutMode(mode)}
                >
                  <Ionicons 
                    name={mode === 'bank' ? 'business-outline' : 'qr-code-outline'} 
                    size={20} 
                    color={payoutMode === mode ? 'white' : thannigoPalette.neutral} 
                  />
                  <Text style={[styles.modeBtnText, payoutMode === mode && styles.modeBtnTextActive]}>
                    {mode === 'bank' ? 'Bank Transfer' : 'UPI ID'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Form Fields */}
            {payoutMode === 'bank' ? (
              <View style={styles.formSection}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Account Holder Name</Text>
                  <TextInput 
                    style={[styles.input, !!pendingRequest && styles.inputDisabled]} 
                    value={bankDetails.holder_name} 
                    onChangeText={(v) => setBankDetails({ ...bankDetails, holder_name: v })}
                    placeholder="Full name as per bank records"
                    placeholderTextColor={thannigoPalette.neutral + '80'}
                    editable={!pendingRequest}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Account Number</Text>
                  <TextInput 
                    style={[styles.input, !!pendingRequest && styles.inputDisabled]} 
                    value={bankDetails.account_number} 
                    onChangeText={(v) => setBankDetails({ ...bankDetails, account_number: v })}
                    placeholder="Enter account number"
                    keyboardType="numeric"
                    placeholderTextColor={thannigoPalette.neutral + '80'}
                    editable={!pendingRequest}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Confirm Account Number</Text>
                  <TextInput 
                    style={[styles.input, !!pendingRequest && styles.inputDisabled]} 
                    value={confirmAccountNumber} 
                    onChangeText={setConfirmAccountNumber}
                    placeholder="Re-enter account number"
                    keyboardType="numeric"
                    placeholderTextColor={thannigoPalette.neutral + '80'}
                    editable={!pendingRequest}
                  />
                  {confirmAccountNumber && bankDetails.account_number !== confirmAccountNumber && (
                    <Text style={{ fontSize: 11, color: '#ba1a1a', marginTop: 4, fontWeight: '700' }}>
                      Does not match account number
                    </Text>
                  )}
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>IFSC Code</Text>
                  <TextInput 
                    style={[styles.input, !!pendingRequest && styles.inputDisabled]} 
                    value={bankDetails.ifsc} 
                    onChangeText={(v) => setBankDetails({ ...bankDetails, ifsc: v.toUpperCase() })}
                    placeholder="e.g. SBIN0001234"
                    autoCapitalize="characters"
                    placeholderTextColor={thannigoPalette.neutral + '80'}
                    editable={!pendingRequest}
                  />
                </View>

                {bankDetails.account_number && !bankVerified && (
                  <TouchableOpacity 
                    style={[styles.verifyBtn, isVerifying && { opacity: 0.7 }]} 
                    onPress={handleVerify}
                    disabled={isVerifying}
                  >
                    {isVerifying ? (
                      <ActivityIndicator color={SHOP_ACCENT} size="small" />
                    ) : (
                      <>
                        <Ionicons name="shield-checkmark-outline" size={16} color={SHOP_ACCENT} />
                        <Text style={styles.verifyBtnText}>Verify Bank Account Now</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                {bankVerified && !pendingRequest && (
                   <View style={styles.verifiedBadgeRow}>
                    <Ionicons name="checkmark-circle" size={16} color={thannigoPalette.success} />
                    <Text style={styles.verifiedBadgeText}>YOUR BANK ACCOUNT IS VERIFIED</Text>
                  </View>
                )}
                {pendingRequest && (
                  <View style={[styles.verifiedBadgeRow, { backgroundColor: '#fff7ed' }]}>
                    <Ionicons name="time-outline" size={16} color="#d97706" />
                    <Text style={[styles.verifiedBadgeText, { color: '#d97706' }]}>
                      {pendingRequest.status === 'PENDING' ? 'VERIFICATION IN PROGRESS' : 'PENDING ADMIN APPROVAL'}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.formSection}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>UPI ID</Text>
                  <TextInput 
                    style={styles.input} 
                    value={upiId} 
                    onChangeText={(text) => {
                       setUpiId(text);
                       if (upiVerified) setUpiVerified(false);
                    }}
                    placeholder="e.g. yourname@upi"
                    autoCapitalize="none"
                    placeholderTextColor={thannigoPalette.neutral + '80'}
                  />
                  {upiId.length > 5 && !upiVerified && (
                    <TouchableOpacity 
                      style={[styles.verifyBtn, isVerifying && { opacity: 0.7 }]} 
                      onPress={handleVerifyUpi}
                      disabled={isVerifying}
                    >
                      {isVerifying ? (
                        <ActivityIndicator color={SHOP_ACCENT} size="small" />
                      ) : (
                        <>
                          <Ionicons name="shield-checkmark-outline" size={16} color={SHOP_ACCENT} />
                          <Text style={styles.verifyBtnText}>Verify UPI ID Now</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  {upiVerified && (
                     <View style={styles.verifiedBadgeRow}>
                      <Ionicons name="checkmark-circle" size={16} color={thannigoPalette.success} />
                      <Text style={styles.verifiedBadgeText}>UPI ID IS VERIFIED</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.hintText}>
                  Instant transfer via PhonePe, GPay, or any UPI app.
                </Text>
              </View>
            )}

            <View style={styles.trustCard}>
              <View style={styles.trustHeader}>
                <Ionicons name="ribbon-outline" size={24} color={SHOP_ACCENT} />
                <Text style={styles.trustTitle}>Settlement Trust Program</Text>
              </View>
              <Text style={styles.trustInfo}>
                Verified payment destinations are eligible for <Text style={{ fontWeight: '900' }}>Instant Settlements</Text> and higher daily withdrawal limits.
              </Text>
              <View style={styles.trustPoint}>
                 <Ionicons name="flash" size={14} color="#fbc02d" />
                 <Text style={styles.trustPointText}>Priority queue for daily payouts</Text>
              </View>
              <View style={styles.trustPoint}>
                 <Ionicons name="lock-closed" size={14} color={thannigoPalette.success} />
                 <Text style={styles.trustPointText}>Bank-grade encrypted storage</Text>
              </View>
            </View>


            <View style={styles.infoBox}>
              <Ionicons name="shield-checkmark" size={18} color={SHOP_ACCENT} />
              <Text style={styles.infoText}>
                Your payment details are encrypted and stored securely. Settlement happens daily.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer Button */}
      {!loading && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveBtn, isSaving && { opacity: 0.7 }]} 
            onPress={handleSave} 
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.saveBtnText}>Save Details</Text>
                <Ionicons name="checkmark-circle" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: thannigoPalette.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 18,
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: thannigoPalette.borderSoft,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: thannigoPalette.darkText, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: thannigoPalette.neutral, fontWeight: '600', marginTop: 2 },
  notifBtnSub: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: SHOP_SURF,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 100 },
  formContainer: { gap: 24 },
  
  fieldLabel: { fontSize: 13, fontWeight: '800', color: thannigoPalette.darkText, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  
  modeToggle: { flexDirection: 'row', gap: 12 },
  modeBtn: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: 'white', paddingVertical: 16, borderRadius: 20, 
    borderWidth: 2, borderColor: thannigoPalette.borderSoft,
  },
  modeBtnActive: { backgroundColor: SHOP_ACCENT, borderColor: SHOP_ACCENT },
  modeBtnText: { fontSize: 14, fontWeight: '800', color: thannigoPalette.neutral },
  modeBtnTextActive: { color: 'white' },
  
  formSection: { gap: 18 },
  field: { gap: 6 },
  input: {
    backgroundColor: 'white', borderRadius: 16, padding: 16,
    fontSize: 16, color: thannigoPalette.darkText, fontWeight: '600',
    borderWidth: 1.5, borderColor: thannigoPalette.borderSoft,
  },
  inputDisabled: {
    backgroundColor: thannigoPalette.borderSoft,
    color: thannigoPalette.neutral,
  },
  hintText: { fontSize: 12, color: thannigoPalette.neutral, fontWeight: '600', lineHeight: 18 },
  
  infoBox: { 
    flexDirection: 'row', gap: 12, backgroundColor: SHOP_SURF, padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: SHOP_ACCENT + '20', marginTop: 10,
  },
  infoText: { flex: 1, fontSize: 13, color: SHOP_ACCENT, fontWeight: '600', lineHeight: 20 },
  
  footer: { 
    padding: 24, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: thannigoPalette.borderSoft,
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  saveBtn: { 
    backgroundColor: SHOP_ACCENT, borderRadius: 20, paddingVertical: 18, 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    ...Shadow.md,
  },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  
  verifyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: SHOP_SURF, paddingVertical: 14, borderRadius: 16,
    borderWidth: 1.5, borderColor: SHOP_ACCENT + '40', marginTop: 10,
  },
  verifyBtnText: { fontSize: 13, fontWeight: '800', color: SHOP_ACCENT, letterSpacing: 0.3 },
  
  verifiedBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, backgroundColor: '#e8f5e9', padding: 12, borderRadius: 12 },
  verifiedBadgeText: { fontSize: 11, fontWeight: '900', color: thannigoPalette.success, letterSpacing: 1 },

  trustCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: thannigoPalette.borderSoft, ...Shadow.sm },
  trustHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  trustTitle: { fontSize: 16, fontWeight: '900', color: thannigoPalette.darkText },
  trustInfo: { fontSize: 13, color: thannigoPalette.neutral, fontWeight: '600', lineHeight: 20, marginBottom: 16 },
  trustPoint: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  trustPointText: { fontSize: 12, fontWeight: '800', color: thannigoPalette.neutral, letterSpacing: 0.3 },
});
