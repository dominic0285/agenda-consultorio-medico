import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  FlatList, Modal, ScrollView, Alert, StatusBar 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

// --- TEMA VISUAL "MODERNO PRO" (El que te gustó) ---
const THEME = {
  bg: '#1A1D21',           // Gris moderno (Fondo)
  card: '#242A33',         // Tarjetas flotantes
  primary: '#4DA8DA',      // Azul Vibrante
  text: '#ECF0F1',         // Blanco suave
  subtext: '#95A5A6',      // Gris texto secundario
  inputBg: '#15171A',      // Fondo inputs (más oscuro)
  danger: '#E74C3C',       // Rojo
  success: '#2ECC71',      // Verde
  border: '#2C3E50'        // Bordes sutiles
};

// --- COMPONENTES UI (DEFINIDOS AFUERA PARA EVITAR CIERRE DE TECLADO) ---

const CampoInput = ({ label, valor, onChange, placeholder, tipo = 'default', ancho = '100%', multilinea = false }) => (
  <View style={{ width: ancho, marginBottom: 15 }}>
    <Text style={styles.labelInput}>{label}</Text>
    <TextInput
      style={[styles.input, multilinea && { height: 80, textAlignVertical: 'top' }]}
      value={valor}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#555"
      keyboardType={tipo}
      multiline={multilinea}
    />
  </View>
);

const SelectorFecha = ({ label, valor, alPresionar }) => (
  <View style={{ flex: 1, marginHorizontal: 4, marginBottom: 15 }}>
    <Text style={styles.labelInput}>{label}</Text>
    <TouchableOpacity style={styles.btnFecha} onPress={alPresionar}>
      <Ionicons name="calendar-outline" size={18} color={THEME.primary} />
      <Text style={styles.txtFecha}>{valor || 'Seleccionar'}</Text>
    </TouchableOpacity>
  </View>
);

const DatoVisor = ({ label, valor, ancho = '50%' }) => (
  <View style={{ width: ancho, marginBottom: 12, paddingRight: 5 }}>
    <Text style={styles.viewLabel}>{label}</Text>
    <Text style={styles.viewValue}>{valor || '---'}</Text>
  </View>
);

// --- APP PRINCIPAL ---
export default function App() {
  const [pacientes, setPacientes] = useState([]);
  
  // Modales
  const [modalFormVisible, setModalFormVisible] = useState(false);
  const [modalViewVisible, setModalViewVisible] = useState(false);
  
  // Control de Edición/Visor
  const [editandoId, setEditandoId] = useState(null);
  const [pacienteVer, setPacienteVer] = useState(null);

  // Fechas
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);
  const [campoFechaActivo, setCampoFechaActivo] = useState(null);

  // Estado del Formulario Completo
  const [formData, setFormData] = useState({
    nombre: '', cedula: '', edad: '', telefono: '', 
    talla: '', peso: '', tension: '', fc_materna: '',
    gesta: '', para: '', cesarea: '', aborto: '',
    fur: '', fpp: '', edad_gestacional: '',
    num_fetos: '', fcf_fetal: '', 
    dbp: '', cc: '', ca: '', lf: '', hum: '', 
    placenta: '', liquido: '',
    anatomia: 'Dentro de límites normales',
    sexo_fetal: '', conclusiones: '',
    fppe: '', fechaRegistro: '' 
  });

  useEffect(() => { cargarDatos(); }, []);

  // --- LÓGICA ---
  const guardarEnMemoria = async (data) => {
    try { await AsyncStorage.setItem('@db_gineco_final', JSON.stringify(data)); } catch (e) {}
  };

  const cargarDatos = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@db_gineco_final');
      if (jsonValue != null) setPacientes(JSON.parse(jsonValue));
    } catch (e) {}
  };

  const actualizarDato = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const abrirCalendario = (campo) => {
    setCampoFechaActivo(campo);
    setMostrarDatePicker(true);
  };

  const confirmarFecha = (event, selectedDate) => {
    setMostrarDatePicker(false);
    if (selectedDate && campoFechaActivo) {
      const fecha = selectedDate.toLocaleDateString('es-ES');
      actualizarDato(campoFechaActivo, fecha);
    }
  };

  const manejarGuardar = () => {
    if (!formData.nombre || !formData.cedula) {
      Alert.alert('Faltan Datos', 'El Nombre y la Cédula son obligatorios');
      return;
    }

    let nuevaLista;
    if (editandoId) {
      nuevaLista = pacientes.map(p => p.id === editandoId ? { ...formData, id: editandoId } : p);
    } else {
      const hoy = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      const nuevo = { ...formData, id: Date.now().toString(), fechaRegistro: hoy };
      nuevaLista = [nuevo, ...pacientes];
    }

    setPacientes(nuevaLista);
    guardarEnMemoria(nuevaLista);
    cerrarFormulario();
  };

  const borrarPaciente = (id) => {
    Alert.alert("¿Eliminar?", "No podrás recuperar esta historia.", [
      { text: "Cancelar" },
      { text: "Sí, Eliminar", onPress: () => {
          const filtrados = pacientes.filter(p => p.id !== id);
          setPacientes(filtrados);
          guardarEnMemoria(filtrados);
          setModalViewVisible(false); // Cerrar visor si estaba abierto
        }, style: "destructive" 
      }
    ]);
  };

  const cerrarFormulario = () => {
    setModalFormVisible(false);
    setEditandoId(null);
    limpiarForm();
  };

  const limpiarForm = () => {
    setFormData({
      nombre: '', cedula: '', edad: '', telefono: '', talla: '', peso: '', tension: '', fc_materna: '',
      gesta: '', para: '', cesarea: '', aborto: '', fur: '', fpp: '', edad_gestacional: '',
      num_fetos: '', fcf_fetal: '', dbp: '', cc: '', ca: '', lf: '', hum: '',
      placenta: '', liquido: '', anatomia: 'Dentro de límites normales', sexo_fetal: '', conclusiones: '', fppe: '', fechaRegistro: ''
    });
  };

  const abrirEditar = (item) => {
    setPacienteVer(null); 
    setModalViewVisible(false); 
    setFormData(item);
    setEditandoId(item.id);
    setModalFormVisible(true);
  };

  const abrirVisor = (item) => {
    setPacienteVer(item);
    setModalViewVisible(true);
  };

  // --- RENDERIZADO DE LA TARJETA (ITEM DE LA LISTA) ---
  const renderTarjeta = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => abrirVisor(item)} activeOpacity={0.9}>
      <View style={styles.cardTop}>
        <View style={styles.iconBox}>
          <Ionicons name="person" size={24} color={THEME.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.nombre}</Text>
          <Text style={styles.cardSub}>C.I: {item.cedula}</Text>
        </View>
        <View style={styles.dateBadge}>
           <Text style={styles.dateBadgeText}>{item.fechaRegistro || 'Hoy'}</Text>
        </View>
      </View>
      
      <View style={styles.cardDivider} />
      
      <View style={styles.cardContent}>
         <Text style={styles.cardTag}>{item.edad} Años</Text>
         {item.fpp ? <Text style={styles.cardTag}>FPP: {item.fpp}</Text> : null}
         <Text style={[styles.cardTag, {backgroundColor: 'transparent', color: THEME.subtext, marginLeft: 'auto'}]}>
           Tocá para ver
         </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Consultorio Médico</Text>
          <Text style={styles.headerSubtitle}>Control Gineco-Obstetra</Text>
        </View>
        <TouchableOpacity style={styles.btnAdd} onPress={() => { limpiarForm(); setModalFormVisible(true); }}>
          <Ionicons name="add" size={32} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* LISTA DE PACIENTES */}
      <FlatList
        data={pacientes}
        keyExtractor={i => i.id}
        renderItem={renderTarjeta}
        contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={50} color={THEME.subtext} />
            <Text style={styles.emptyText}>No hay historias registradas</Text>
          </View>
        }
      />

      {/* --- MODAL FORMULARIO (EDITOR) --- */}
      <Modal visible={modalFormVisible} animationType="slide" onRequestClose={cerrarFormulario}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editandoId ? 'Editar Historia' : 'Nueva Historia'}</Text>
            <TouchableOpacity onPress={cerrarFormulario}>
              <Ionicons name="close-circle" size={30} color={THEME.subtext} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionHeader}>1. DATOS PERSONALES</Text>
            <CampoInput label="Nombre y Apellido" valor={formData.nombre} onChange={t=>actualizarDato('nombre', t)} placeholder="Nombre completo" />
            
            <View style={styles.row}>
              <CampoInput label="Cédula" ancho="48%" valor={formData.cedula} onChange={t=>actualizarDato('cedula', t)} tipo="numeric" />
              <CampoInput label="Edad" ancho="48%" valor={formData.edad} onChange={t=>actualizarDato('edad', t)} tipo="numeric" />
            </View>
            <CampoInput label="Teléfono" valor={formData.telefono} onChange={t=>actualizarDato('telefono', t)} tipo="phone-pad" />
            
            <View style={styles.row}>
               <CampoInput label="Peso (Kg)" ancho="30%" valor={formData.peso} onChange={t=>actualizarDato('peso', t)} tipo="numeric" />
               <CampoInput label="Talla (cm)" ancho="30%" valor={formData.talla} onChange={t=>actualizarDato('talla', t)} tipo="numeric" />
               <CampoInput label="Tensión" ancho="30%" valor={formData.tension} onChange={t=>actualizarDato('tension', t)} />
            </View>

            <Text style={styles.sectionHeader}>2. OBSTETRICIA</Text>
            <View style={styles.row}>
               <CampoInput label="Gesta" ancho="23%" valor={formData.gesta} onChange={t=>actualizarDato('gesta', t)} tipo="numeric" />
               <CampoInput label="Para" ancho="23%" valor={formData.para} onChange={t=>actualizarDato('para', t)} tipo="numeric" />
               <CampoInput label="Cesárea" ancho="23%" valor={formData.cesarea} onChange={t=>actualizarDato('cesarea', t)} tipo="numeric" />
               <CampoInput label="Aborto" ancho="23%" valor={formData.aborto} onChange={t=>actualizarDato('aborto', t)} tipo="numeric" />
            </View>
            
            <View style={styles.row}>
              <SelectorFecha label="F.U.R" valor={formData.fur} alPresionar={()=>abrirCalendario('fur')} />
              <SelectorFecha label="F.P.P" valor={formData.fpp} alPresionar={()=>abrirCalendario('fpp')} />
            </View>

            <View style={styles.row}>
               <CampoInput label="Edad Gestacional" ancho="60%" valor={formData.edad_gestacional} onChange={t=>actualizarDato('edad_gestacional', t)} />
               <CampoInput label="Nº Fetos" ancho="35%" valor={formData.num_fetos} onChange={t=>actualizarDato('num_fetos', t)} tipo="numeric" />
            </View>

            <Text style={styles.sectionHeader}>3. BIOMETRÍA Y ECO</Text>
            <View style={styles.row}>
               <CampoInput label="DBP" ancho="23%" valor={formData.dbp} onChange={t=>actualizarDato('dbp', t)} tipo="numeric" />
               <CampoInput label="CC" ancho="23%" valor={formData.cc} onChange={t=>actualizarDato('cc', t)} tipo="numeric" />
               <CampoInput label="CA" ancho="23%" valor={formData.ca} onChange={t=>actualizarDato('ca', t)} tipo="numeric" />
               <CampoInput label="LF" ancho="23%" valor={formData.lf} onChange={t=>actualizarDato('lf', t)} tipo="numeric" />
            </View>
            <CampoInput label="Placenta" valor={formData.placenta} onChange={t=>actualizarDato('placenta', t)} placeholder="Ubicación y Grado" />
            <CampoInput label="Anatomía Fetal" valor={formData.anatomia} onChange={t=>actualizarDato('anatomia', t)} multilinea={true} />

            <Text style={styles.sectionHeader}>4. DIAGNÓSTICO</Text>
            <CampoInput label="Conclusiones" valor={formData.conclusiones} onChange={t=>actualizarDato('conclusiones', t)} multilinea={true} placeholder="Escriba aquí las conclusiones..." />
            
            <SelectorFecha label="Fecha Próxima Cita (FPPE)" valor={formData.fppe} alPresionar={()=>abrirCalendario('fppe')} />

            <TouchableOpacity style={styles.btnSave} onPress={manejarGuardar}>
              <Text style={styles.btnSaveText}>GUARDAR DATOS</Text>
            </TouchableOpacity>
            <View style={{height: 50}} />
          </ScrollView>
        </View>
      </Modal>

      {/* --- MODAL VISOR (REPORTE) --- */}
      <Modal visible={modalViewVisible} animationType="fade" onRequestClose={()=>setModalViewVisible(false)}>
        <View style={styles.modalContainer}>
           <View style={[styles.modalHeader, {borderBottomColor: 'transparent'}]}>
            <Text style={styles.modalTitle}>Ficha Médica</Text>
            <TouchableOpacity onPress={()=>setModalViewVisible(false)}>
              <Ionicons name="close" size={28} color="#FFF"/>
            </TouchableOpacity>
          </View>
          
          {pacienteVer && (
            <ScrollView style={styles.modalBody}>
              {/* Card Resumen Superior */}
              <View style={styles.reportCard}>
                <View style={{alignItems: 'center', marginBottom: 10}}>
                   <Ionicons name="person-circle" size={60} color={THEME.primary} />
                   <Text style={styles.reportName}>{pacienteVer.nombre}</Text>
                   <Text style={styles.reportId}>C.I: {pacienteVer.cedula} • {pacienteVer.edad} Años</Text>
                </View>
                <View style={styles.row}>
                   <DatoVisor label="Peso" valor={pacienteVer.peso} ancho="33%" />
                   <DatoVisor label="Talla" valor={pacienteVer.talla} ancho="33%" />
                   <DatoVisor label="Tensión" valor={pacienteVer.tension} ancho="33%" />
                </View>
              </View>

              {/* Secciones Detalles */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitleView}>OBSTETRICIA</Text>
                <View style={styles.rowWrap}>
                  <DatoVisor label="Gesta" valor={pacienteVer.gesta} ancho="25%" />
                  <DatoVisor label="Para" valor={pacienteVer.para} ancho="25%" />
                  <DatoVisor label="Cesárea" valor={pacienteVer.cesarea} ancho="25%" />
                  <DatoVisor label="Aborto" valor={pacienteVer.aborto} ancho="25%" />
                  <View style={styles.dividerLight} />
                  <DatoVisor label="F.U.R" valor={pacienteVer.fur} />
                  <DatoVisor label="F.P.P" valor={pacienteVer.fpp} />
                  <DatoVisor label="Edad Gest." valor={pacienteVer.edad_gestacional} ancho="100%"/>
                </View>
              </View>

              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitleView}>ECOSONOGRAFÍA</Text>
                <View style={styles.rowWrap}>
                   <DatoVisor label="DBP" valor={pacienteVer.dbp} ancho="25%" />
                   <DatoVisor label="CC" valor={pacienteVer.cc} ancho="25%" />
                   <DatoVisor label="CA" valor={pacienteVer.ca} ancho="25%" />
                   <DatoVisor label="LF" valor={pacienteVer.lf} ancho="25%" />
                   <DatoVisor label="Placenta" valor={pacienteVer.placenta} ancho="100%" />
                   <DatoVisor label="Anatomía" valor={pacienteVer.anatomia} ancho="100%" />
                </View>
              </View>

              <View style={[styles.sectionContainer, {borderColor: THEME.primary, borderWidth: 1}]}>
                <Text style={[styles.sectionTitleView, {color: THEME.primary}]}>CONCLUSIONES</Text>
                <Text style={styles.reportTextBig}>{pacienteVer.conclusiones || 'Sin conclusiones.'}</Text>
              </View>

              <View style={styles.nextDateBox}>
                 <Text style={styles.nextDateLabel}>PRÓXIMA CITA</Text>
                 <Text style={styles.nextDateValue}>{pacienteVer.fppe || 'Por definir'}</Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.btnActionFull, {backgroundColor: '#333'}]} onPress={() => abrirEditar(pacienteVer)}>
                   <Ionicons name="create-outline" size={20} color="#FFF" />
                   <Text style={styles.btnActionText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnActionFull, {backgroundColor: 'rgba(231, 76, 60, 0.2)'}]} onPress={() => borrarPaciente(pacienteVer.id)}>
                   <Ionicons name="trash-outline" size={20} color={THEME.danger} />
                   <Text style={[styles.btnActionText, {color: THEME.danger}]}>Eliminar</Text>
                </TouchableOpacity>
              </View>
              <View style={{height: 50}} />
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* DatePicker Oculto */}
      {mostrarDatePicker && (
        <DateTimePicker value={new Date()} mode="date" display="default" onChange={confirmarFecha} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  
  // Header
  header: {
    paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20,
    backgroundColor: THEME.bg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.text },
  headerSubtitle: { fontSize: 14, color: THEME.primary, fontWeight: '600' },
  btnAdd: { backgroundColor: THEME.primary, width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 5 },

  // Lista Cards
  card: { backgroundColor: THEME.card, borderRadius: 16, marginBottom: 15, padding: 15, elevation: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 45, height: 45, borderRadius: 23, backgroundColor: 'rgba(77, 168, 218, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardTitle: { color: THEME.text, fontSize: 18, fontWeight: 'bold' },
  cardSub: { color: THEME.subtext, fontSize: 13 },
  dateBadge: { backgroundColor: '#1A1D21', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  dateBadgeText: { color: THEME.text, fontSize: 11, fontWeight: 'bold' },
  cardDivider: { height: 1, backgroundColor: '#333', marginVertical: 12 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  cardTag: { color: THEME.subtext, fontSize: 12, marginRight: 15, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: THEME.subtext, marginTop: 10, fontSize: 16 },

  // Modales
  modalContainer: { flex: 1, backgroundColor: THEME.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderColor: '#333', backgroundColor: THEME.card },
  modalTitle: { color: THEME.text, fontSize: 20, fontWeight: 'bold' },
  modalBody: { padding: 20 },
  
  // Formulario Estilos
  sectionHeader: { color: THEME.primary, fontSize: 13, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, marginTop: 10, borderBottomWidth: 1, borderColor: '#333', paddingBottom: 5 },
  labelInput: { color: THEME.subtext, fontSize: 12, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: THEME.inputBg, color: THEME.text, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: THEME.border, fontSize: 16 },
  btnFecha: { backgroundColor: THEME.inputBg, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: THEME.primary },
  txtFecha: { color: THEME.text, marginLeft: 10, fontWeight: '500' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  btnSave: { backgroundColor: THEME.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  btnSaveText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  // Visor Estilos
  reportCard: { backgroundColor: THEME.card, borderRadius: 15, padding: 20, marginBottom: 20, alignItems: 'center' },
  reportName: { color: THEME.text, fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  reportId: { color: THEME.subtext, fontSize: 14, marginBottom: 15 },
  sectionContainer: { backgroundColor: '#202327', padding: 15, borderRadius: 12, marginBottom: 15 },
  sectionTitleView: { color: THEME.subtext, fontSize: 11, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  viewLabel: { color: '#666', fontSize: 11, marginBottom: 2 },
  viewValue: { color: '#DDD', fontSize: 15, fontWeight: '500' },
  dividerLight: { width: '100%', height: 1, backgroundColor: '#333', marginVertical: 10 },
  reportTextBig: { color: '#FFF', fontSize: 16, lineHeight: 24 },
  nextDateBox: { backgroundColor: 'rgba(77, 168, 218, 0.1)', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: THEME.primary, marginBottom: 20 },
  nextDateLabel: { color: THEME.primary, fontWeight: 'bold', fontSize: 12 },
  nextDateValue: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginTop: 5 },
  actionButtons: { flexDirection: 'row', gap: 10 },
  btnActionFull: { flex: 1, flexDirection: 'row', justifyContent: 'center', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnActionText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 }
});