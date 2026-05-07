import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useArmStore } from '../state/useArmStore';

export default function ControlBanner() {
  const {
    isMaster, hasOtherSessions, controlRequest, controlRequestStatus,
    passMasterControl, requestMasterControl, respondToControlRequest,
  } = useArmStore();

  // Solo mostrar cuando hay más de una sesión activa
  if (!hasOtherSessions) return null;

  // ── MAESTRO ──────────────────────────────────────────────────────────────────
  if (isMaster) {
    return (
      <View style={s.bar}>
        <View style={s.badgeMaster}>
          <View style={s.dotGreen} />
          <Text style={s.badgeMasterText}>MAESTRO</Text>
        </View>

        {controlRequest ? (
          // Hay una solicitud entrante de un espectador
          <>
            <Text style={s.requestMsg}>⚡ Espectador solicita el control</Text>
            <TouchableOpacity style={s.btnAccept} onPress={() => respondToControlRequest(true)}>
              <Text style={s.btnAcceptText}>Aceptar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnDeny} onPress={() => respondToControlRequest(false)}>
              <Text style={s.btnDenyText}>Denegar</Text>
            </TouchableOpacity>
          </>
        ) : (
          // Sin solicitud — botón para ceder control voluntariamente
          <TouchableOpacity style={s.btnPass} onPress={passMasterControl}>
            <Text style={s.btnPassText}>Pasar control →</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ── ESPECTADOR ───────────────────────────────────────────────────────────────
  return (
    <View style={s.bar}>
      <View style={s.badgeSpectator}>
        <View style={s.dotAmber} />
        <Text style={s.badgeSpectatorText}>ESPECTADOR · Solo lectura</Text>
      </View>

      {controlRequestStatus === 'pending' ? (
        <View style={s.pendingWrap}>
          <ActivityIndicator size="small" color="#ffaa00" />
          <Text style={s.pendingText}>Solicitud enviada…</Text>
        </View>
      ) : controlRequestStatus === 'denied' ? (
        <>
          <Text style={s.deniedText}>Solicitud denegada</Text>
          <TouchableOpacity
            style={s.btnRequest}
            onPress={requestMasterControl}
          >
            <Text style={s.btnRequestText}>Reintentar</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={s.btnRequest} onPress={requestMasterControl}>
          <Text style={s.btnRequestText}>Pedir control</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#08111e',
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,180,255,0.10)',
    flexWrap: 'wrap',
  },

  // Badges
  badgeMaster: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,229,160,0.08)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(0,229,160,0.25)',
  },
  badgeMasterText: { fontSize: 11, fontWeight: '700', color: '#00e5a0', letterSpacing: 1 },
  badgeSpectator: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,170,0,0.08)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,170,0,0.3)',
  },
  badgeSpectatorText: { fontSize: 11, fontWeight: '700', color: '#ffaa00', letterSpacing: 1 },

  dotGreen: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00e5a0' },
  dotAmber: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffaa00' },

  // Request alert (master side)
  requestMsg: { fontSize: 12, color: '#ffaa00', fontWeight: '500', flex: 1 },

  // Buttons
  btnPass: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
    backgroundColor: 'rgba(0,180,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(0,180,255,0.25)',
  },
  btnPassText: { fontSize: 12, color: '#00b4ff', fontWeight: '600' },

  btnAccept: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
    backgroundColor: 'rgba(0,229,160,0.12)',
    borderWidth: 1, borderColor: 'rgba(0,229,160,0.35)',
  },
  btnAcceptText: { fontSize: 12, color: '#00e5a0', fontWeight: '600' },

  btnDeny: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
    backgroundColor: 'rgba(255,68,85,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,68,85,0.3)',
  },
  btnDenyText: { fontSize: 12, color: '#ff4455', fontWeight: '600' },

  btnRequest: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
    backgroundColor: 'rgba(255,170,0,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,170,0,0.3)',
  },
  btnRequestText: { fontSize: 12, color: '#ffaa00', fontWeight: '600' },

  // Pending / denied states (spectator)
  pendingWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pendingText: { fontSize: 12, color: '#ffaa00' },
  deniedText: { fontSize: 12, color: '#ff4455' },
});
