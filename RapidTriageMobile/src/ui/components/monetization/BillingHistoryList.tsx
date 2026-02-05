/**
 * BillingHistoryList Component
 * Displays list of past invoices and billing history
 */

import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../styles/themes';
import { SPACING, BORDER_RADIUS } from '../../styles/themes';
import { H3, Body1, Body2 } from '../common/Typography';
import { Card } from '../common/Card';

export interface BillingItem {
  id: string;
  date: string; // ISO date string
  amount: number; // in cents
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  description: string;
  invoiceUrl?: string;
  receiptUrl?: string;
}

export interface BillingHistoryListProps {
  items: BillingItem[];
  loading?: boolean;
  onRefresh?: () => void;
  emptyMessage?: string;
  style?: ViewStyle;
}

export const BillingHistoryList: React.FC<BillingHistoryListProps> = ({
  items,
  loading = false,
  onRefresh,
  emptyMessage = 'No billing history',
  style,
}) => {
  const theme = useTheme();

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatAmount = (cents: number, currency: string): string => {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const getStatusColor = (status: BillingItem['status']): string => {
    switch (status) {
      case 'paid':
        return theme.SUCCESS;
      case 'pending':
        return theme.WARNING;
      case 'failed':
        return theme.ERROR;
      case 'refunded':
        return theme.INFO;
      default:
        return theme.TEXT_SECONDARY;
    }
  };

  const getStatusLabel = (status: BillingItem['status']): string => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'refunded':
        return 'Refunded';
      default:
        return status;
    }
  };

  const handleViewInvoice = (url: string) => {
    Linking.openURL(url);
  };

  const renderItem = ({ item }: { item: BillingItem }) => (
    <View
      style={[
        styles.itemContainer,
        {
          backgroundColor: theme.BACKGROUND_PRIMARY,
          borderBottomColor: theme.BORDER_PRIMARY,
        },
      ]}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Body1 style={[styles.itemDescription, { color: theme.TEXT }]}>
            {item.description}
          </Body1>
          <Body2 style={[styles.itemDate, { color: theme.TEXT_SECONDARY }]}>
            {formatDate(item.date)}
          </Body2>
        </View>
        
        <View style={styles.itemRight}>
          <Body1 style={[styles.itemAmount, { color: theme.TEXT }]}>
            {formatAmount(item.amount, item.currency)}
          </Body1>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + '20' },
            ]}
          >
            <Body2
              style={[styles.statusText, { color: getStatusColor(item.status) }]}
            >
              {getStatusLabel(item.status)}
            </Body2>
          </View>
        </View>
      </View>

      {/* Invoice/Receipt Links */}
      {(item.invoiceUrl || item.receiptUrl) && (
        <View style={styles.itemActions}>
          {item.invoiceUrl && (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: theme.BORDER_PRIMARY }]}
              onPress={() => handleViewInvoice(item.invoiceUrl!)}
            >
              <Body2 style={[styles.actionText, { color: theme.PRIMARY }]}>
                View Invoice
              </Body2>
            </TouchableOpacity>
          )}
          {item.receiptUrl && (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: theme.BORDER_PRIMARY }]}
              onPress={() => handleViewInvoice(item.receiptUrl!)}
            >
              <Body2 style={[styles.actionText, { color: theme.PRIMARY }]}>
                View Receipt
              </Body2>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Body1 style={[styles.emptyIcon, { color: theme.TEXT_TERTIARY }]}>
        📋
      </Body1>
      <Body1 style={[styles.emptyText, { color: theme.TEXT_SECONDARY }]}>
        {emptyMessage}
      </Body1>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <H3 style={[styles.headerTitle, { color: theme.TEXT }]}>
        Billing History
      </H3>
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={items.length > 0 ? renderHeader : null}
        ListEmptyComponent={renderEmpty}
        refreshing={loading}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={items.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  itemContainer: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    marginRight: SPACING.MD,
  },
  itemDescription: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: SPACING.XS / 2,
  },
  itemDate: {
    fontSize: 13,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.XS,
  },
  statusBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS / 2,
    borderRadius: BORDER_RADIUS.SM,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  itemActions: {
    flexDirection: 'row',
    marginTop: SPACING.SM,
    gap: SPACING.SM,
  },
  actionButton: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.XXL,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.MD,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
  },
});

export default BillingHistoryList;
