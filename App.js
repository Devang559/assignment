import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// ⚠️ REPLACE WITH YOUR MOCKAPI ENDPOINT
const API_URL = 'https://6a648251b30b52361e1b1598.mockapi.io/order_item';

const Stack = createStackNavigator();

// Minimal Status Badges
const getStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case 'delivered':
      return { bg: '#E6F4EA', text: '#137333' };
    case 'shipped':
      return { bg: '#E8F0FE', text: '#1A73E8' };
    case 'processing':
      return { bg: '#FEF7E0', text: '#B06000' };
    case 'pending':
      return { bg: '#F1F3F4', text: '#5F6368' };
    case 'cancelled':
      return { bg: '#FCE8E6', text: '#C5221F' };
    default:
      return { bg: '#F1F3F4', text: '#5F6368' };
  }
};

// ==========================================
// SCREEN 1: MINIMAL ORDER LIST
// ==========================================
function OrderListScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setError(null);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Unable to load orders.');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#000000" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const { bg, text } = getStatusBadge(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.6}
        onPress={() => navigation.navigate('OrderDetail', { order: item })}
      >
        <View style={styles.rowBetween}>
          <Text style={styles.orderId}>#{item.id}</Text>
          <View style={[styles.badge, { backgroundColor: bg }]}>
            <Text style={[styles.badgeText, { color: text }]}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.customerName}>{item.customer}</Text>

        <View style={[styles.rowBetween, styles.cardFooter]}>
          <Text style={styles.subText}>
            {new Date(item.placed_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.amount}>
            ${typeof item.amount === 'number' ? item.amount.toFixed(2) : item.amount}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={orders.length === 0 ? styles.center : styles.listPadding}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.subText}>No orders found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ==========================================
// SCREEN 2: MINIMAL ORDER DETAIL
// ==========================================
function OrderDetailScreen({ route }) {
  const { order } = route.params;
  const { bg, text } = getStatusBadge(order.status);

  const steps = ['Placed', 'Processing', 'Shipped', 'Delivered'];

  const getStepIndex = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 0;
      case 'processing': return 1;
      case 'shipped': return 2;
      case 'delivered': return 3;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(order.status);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.detailWrapper}>
        {/* Top Info Section */}
        <View style={styles.detailHeader}>
          <View style={styles.rowBetween}>
            <Text style={styles.detailTitle}>Order #{order.id}</Text>
            <View style={[styles.badge, { backgroundColor: bg }]}>
              <Text style={[styles.badgeText, { color: text }]}>{order.status}</Text>
            </View>
          </View>

          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Customer</Text>
            <Text style={styles.infoValue}>{order.customer}</Text>
          </View>

          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Items</Text>
            <Text style={styles.infoValue}>{order.items}</Text>
          </View>

          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Total Amount</Text>
            <Text style={styles.infoAmount}>
              ${typeof order.amount === 'number' ? order.amount.toFixed(2) : order.amount}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Timeline</Text>

        {/* Minimalist Vertical Timeline */}
        <View style={styles.timeline}>
          {steps.map((step, idx) => {
            const isDone = idx <= currentStep;
            const isLast = idx === steps.length - 1;

            return (
              <View key={step} style={styles.timelineRow}>
                <View style={styles.timelineGraphic}>
                  <View style={[styles.dot, isDone && styles.dotActive]} />
                  {!isLast && <View style={[styles.line, isDone && styles.lineActive]} />}
                </View>
                <Text style={[styles.timelineLabel, isDone && styles.timelineLabelActive]}>
                  {step}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// NAVIGATION SETUP
// ==========================================
export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#FFFFFF', elevation: 0, shadowOpacity: 0 },
          headerTitleStyle: { fontWeight: '600', fontSize: 17, color: '#000000' },
          headerTintColor: '#000000',
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen name="OrderList" component={OrderListScreen} options={{ title: 'Orders' }} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Details' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ==========================================
// MINIMAL & WELL-DISTRIBUTED STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  listPadding: { padding: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  orderId: { fontSize: 16, fontWeight: '700', color: '#111111' },
  customerName: { fontSize: 15, color: '#444444', marginTop: 8 },
  cardFooter: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#FAFAFA' },
  subText: { fontSize: 13, color: '#888888' },
  amount: { fontSize: 15, fontWeight: '600', color: '#111111' },

  // Status Badges
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' },

  // Detail Screen
  detailWrapper: { padding: 24, flex: 1 },
  detailHeader: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 28,
  },
  detailTitle: { fontSize: 20, fontWeight: '700', color: '#111111' },
  infoGroup: { marginTop: 14 },
  infoLabel: { fontSize: 12, color: '#888888', textTransform: 'uppercase', tracking: 0.5 },
  infoValue: { fontSize: 15, color: '#222222', marginTop: 2, fontWeight: '500' },
  infoAmount: { fontSize: 18, color: '#111111', marginTop: 2, fontWeight: '700' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#888888', marginBottom: 16, textTransform: 'uppercase' },

  // Timeline
  timeline: { paddingLeft: 8 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', height: 48 },
  timelineGraphic: { alignItems: 'center', marginRight: 16, width: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0E0E0', marginTop: 4 },
  dotActive: { backgroundColor: '#000000' },
  line: { width: 2, flex: 1, backgroundColor: '#E0E0E0', marginVertical: 4 },
  lineActive: { backgroundColor: '#000000' },
  timelineLabel: { fontSize: 15, color: '#A0A0A0', fontWeight: '400' },
  timelineLabelActive: { color: '#000000', fontWeight: '600' },

  // Actions / State
  errorText: { color: '#C5221F', fontSize: 14, marginBottom: 12 },
  retryButton: { backgroundColor: '#000000', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  retryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});