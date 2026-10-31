import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Category = 'Comida' | 'Transporte' | 'Servicios' | 'Ocio' | 'Otros';
type Expense = {
  id: string;
  concept: string;
  amountCents: number;
  category: Category;
  createdAt: string;
};

const STORAGE_KEY = 'mi-billetera-lite-gastos-v1';
const categories: Category[] = ['Comida', 'Transporte', 'Servicios', 'Ocio', 'Otros'];
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const dateTime = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

function isExpense(value: unknown): value is Expense {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Expense>;
  return typeof item.id === 'string' && typeof item.concept === 'string' &&
    Number.isSafeInteger(item.amountCents) && (item.amountCents ?? 0) > 0 &&
    categories.includes(item.category as Category) &&
    typeof item.createdAt === 'string' && !Number.isNaN(Date.parse(item.createdAt));
}

export default function App() {
  const { width } = useWindowDimensions();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Comida');
  const [message, setMessage] = useState('Tus datos se guardan solo en este dispositivo.');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active) return;
        const data: unknown = raw ? JSON.parse(raw) : [];
        if (Array.isArray(data)) {
          setExpenses(data.filter(isExpense).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
        }
      })
      .catch(() => setMessage('No se pudieron leer los gastos guardados.'))
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);

  const totalCents = useMemo(() => expenses.reduce((sum, item) => sum + item.amountCents, 0), [expenses]);

  async function saveExpense() {
    const cleanConcept = concept.trim();
    const cleanAmount = amount.trim().replace(',', '.');
    const value = Number(cleanAmount);
    const amountCents = Math.round(value * 100);
    if (!cleanConcept || !/^\d+(\.\d{1,2})?$/.test(cleanAmount) || !Number.isSafeInteger(amountCents) || amountCents <= 0) {
      setMessage('Escribe un concepto y un monto mayor a cero.');
      return;
    }
    if (saving || !loaded) return;
    setSaving(true);
    const next = [{
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      concept: cleanConcept,
      amountCents,
      category,
      createdAt: new Date().toISOString(),
    }, ...expenses];
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setExpenses(next);
      setConcept('');
      setAmount('');
      setCategory('Comida');
      setMessage('Gasto guardado.');
    } catch {
      setMessage('No se pudo guardar el gasto.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={styles.logo}><Text style={styles.logoText}>B</Text></View>
        <View>
          <Text style={styles.brand}>Mi Billetera Lite</Text>
          <Text style={styles.subtitle}>Control de gastos diarios</Text>
        </View>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>TOTAL GASTADO</Text>
        <Text style={styles.total}>{money.format(totalCents / 100)}</Text>
        <Text style={styles.summaryDetail}>{expenses.length} {expenses.length === 1 ? 'gasto registrado' : 'gastos registrados'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.eyebrow}>NUEVO REGISTRO</Text>
        <Text style={styles.title}>Agregar gasto</Text>
        <View style={[styles.fields, width >= 680 && styles.fieldsWide]}>
          <View style={styles.field}>
            <Text style={styles.label}>Concepto</Text>
            <TextInput accessibilityLabel="Concepto" style={styles.input} value={concept} onChangeText={setConcept} placeholder="Ej. Café" placeholderTextColor="#98a5b5" maxLength={80} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Monto</Text>
            <TextInput accessibilityLabel="Monto" style={styles.input} value={amount} onChangeText={setAmount} placeholder="$ 0.00" placeholderTextColor="#98a5b5" keyboardType="decimal-pad" />
          </View>
        </View>
        <Text style={styles.label}>Categoría</Text>
        <View style={styles.categories} accessibilityRole="radiogroup" accessibilityLabel="Categoría">
          {categories.map((option) => (
            <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: category === option }} onPress={() => setCategory(option)} style={[styles.chip, category === option && styles.chipSelected]}>
              <Text style={[styles.chipText, category === option && styles.chipTextSelected]}>{option}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Guardar gasto" disabled={saving || !loaded} onPress={saveExpense} style={[styles.button, (saving || !loaded) && styles.buttonDisabled]}>
          <Text style={styles.buttonText}>{saving ? 'Guardando...' : '＋  Guardar gasto'}</Text>
        </Pressable>
        <Text accessibilityRole="alert" style={styles.message}>{message}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.historyHeader}>
          <View>
            <Text style={styles.eyebrow}>TUS MOVIMIENTOS</Text>
            <Text style={styles.title}>Historial de gastos</Text>
          </View>
          <Text style={styles.count}>{expenses.length} {expenses.length === 1 ? 'registro' : 'registros'}</Text>
        </View>
        {!loaded ? <Text style={styles.empty}>Cargando gastos...</Text> :
          expenses.length === 0 ? <Text style={styles.empty}>Aún no hay gastos. Agrega el primero para empezar.</Text> :
          expenses.map((expense) => (
            <View key={expense.id} style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.categoryIcon}><Text style={styles.categoryIconText}>{expense.category[0]}</Text></View>
                <View style={styles.rowCopy}>
                  <Text style={styles.concept}>{expense.concept}</Text>
                  <Text style={styles.meta}>{expense.category} · {dateTime.format(new Date(expense.createdAt))}</Text>
                </View>
              </View>
              <Text style={styles.rowAmount}>{money.format(expense.amountCents / 100)}</Text>
            </View>
          ))}
      </View>
      <Text style={styles.footer}>Disponible sin conexión después de la primera visita.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f4f6fa' },
  page: { width: '100%', maxWidth: 880, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 36, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 2 },
  logo: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#172b4d' },
  logoText: { color: '#ffffff', fontWeight: '800', fontSize: 21 },
  brand: { color: '#172b4d', fontSize: 16, fontWeight: '800' },
  subtitle: { color: '#728199', fontSize: 12, marginTop: 2 },
  summary: { backgroundColor: '#172b4d', borderRadius: 20, padding: 28, minHeight: 174, justifyContent: 'center' },
  summaryLabel: { color: '#b9cce8', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  total: { color: '#ffffff', fontSize: 46, fontWeight: '800', marginTop: 8 },
  summaryDetail: { color: '#cfdaea', fontSize: 13, marginTop: 12 },
  card: { backgroundColor: '#ffffff', borderColor: '#e8edf4', borderWidth: 1, borderRadius: 18, padding: 24 },
  eyebrow: { color: '#4e79ac', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#172b4d', fontSize: 21, fontWeight: '800', marginTop: 5, marginBottom: 20 },
  fields: { gap: 14, marginBottom: 18 },
  fieldsWide: { flexDirection: 'row' },
  field: { flex: 1 },
  label: { color: '#42536d', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: { height: 46, borderColor: '#dce4ee', borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, color: '#172b4d', backgroundColor: '#ffffff', fontSize: 15 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { borderColor: '#dce4ee', borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#ffffff' },
  chipSelected: { borderColor: '#2563a7', backgroundColor: '#eaf2fb' },
  chipText: { color: '#63748b', fontSize: 12, fontWeight: '700' },
  chipTextSelected: { color: '#1e518b' },
  button: { height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#2563a7' },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  message: { color: '#7c899b', fontSize: 12, marginTop: 12, textAlign: 'center' },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  count: { color: '#687992', backgroundColor: '#f1f4f8', borderRadius: 999, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6, fontSize: 11, fontWeight: '700' },
  empty: { color: '#8190a3', textAlign: 'center', fontSize: 13, paddingVertical: 18 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 14, borderTopColor: '#edf1f6', borderTopWidth: 1 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, gap: 11 },
  categoryIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#edf3fa', alignItems: 'center', justifyContent: 'center' },
  categoryIconText: { color: '#4773a8', fontWeight: '800', fontSize: 15 },
  rowCopy: { flex: 1, minWidth: 0 },
  concept: { color: '#172b4d', fontSize: 14, fontWeight: '700' },
  meta: { color: '#8794a5', fontSize: 11, marginTop: 3 },
  rowAmount: { color: '#172b4d', fontSize: 14, fontWeight: '800' },
  footer: { color: '#97a3b3', fontSize: 11, textAlign: 'center' },
});
