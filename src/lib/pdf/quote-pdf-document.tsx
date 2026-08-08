import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'

import type { Quote, QuoteItem } from '@/lib/types/quote'
import { formatCurrency } from '@/lib/utils'

/**
 * 기본 PDF 내장 폰트는 한글을 지원하지 않아 Noto Sans KR을 등록한다.
 * Google Fonts CDN(gstatic)의 정적 TTF 파일 URL을 직접 지정해 런타임에 불러온다.
 */
Font.register({
  family: 'Noto Sans KR',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/notosanskr/v39/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzuoyeLQ.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/notosanskr/v39/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzg01eLQ.ttf',
      fontWeight: 700,
    },
  ],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Noto Sans KR',
    fontSize: 10,
    padding: 40,
    color: '#111827',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  infoBlock: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: 700,
  },
  table: {
    borderTop: '1pt solid #e5e7eb',
    borderBottom: '1pt solid #e5e7eb',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderTop: '1pt solid #f3f4f6',
  },
  colItemName: { flex: 3, paddingHorizontal: 6 },
  colQuantity: { flex: 1, paddingHorizontal: 6, textAlign: 'right' },
  colUnitPrice: { flex: 2, paddingHorizontal: 6, textAlign: 'right' },
  colSubtotal: { flex: 2, paddingHorizontal: 6, textAlign: 'right' },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 700,
    color: '#6b7280',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 12,
    borderTop: '1pt solid #e5e7eb',
  },
  totalLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginRight: 12,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 700,
  },
})

interface QuotePdfDocumentProps {
  quote: Quote
  items: QuoteItem[]
}

/** 견적서 PDF 문서 템플릿입니다. */
export function QuotePdfDocument({ quote, items }: QuotePdfDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{quote.invoiceNumber}</Text>
        <Text style={styles.subtitle}>견적서</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>클라이언트</Text>
            <Text style={styles.infoValue}>{quote.clientName}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>발행일 / 유효기간</Text>
            <Text style={styles.infoValue}>
              {quote.issueDate} ~ {quote.expiryDate}
            </Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>상태</Text>
            <Text style={styles.infoValue}>{quote.status}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colItemName, styles.tableHeaderText]}>
              품목명
            </Text>
            <Text style={[styles.colQuantity, styles.tableHeaderText]}>
              수량
            </Text>
            <Text style={[styles.colUnitPrice, styles.tableHeaderText]}>
              단가
            </Text>
            <Text style={[styles.colSubtotal, styles.tableHeaderText]}>
              소계
            </Text>
          </View>
          {items.map(item => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colItemName}>{item.itemName}</Text>
              <Text style={styles.colQuantity}>{item.quantity}</Text>
              <Text style={styles.colUnitPrice}>
                {formatCurrency(item.unitPrice)}
              </Text>
              <Text style={styles.colSubtotal}>
                {formatCurrency(item.quantity * item.unitPrice)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>총 견적 금액</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(quote.totalAmount)}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
