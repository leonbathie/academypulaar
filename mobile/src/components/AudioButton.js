import { useEffect } from 'react'
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio'
import { colors, radius, spacing } from '../theme'
import { mediaUrl } from '../config'

// Bouton d'écoute d'un enregistrement (prononciation d'un mot ou exemple).
// Le player est créé par le hook, qui le libère automatiquement au démontage.
export default function AudioButton({ source, label, compact = false }) {
    const uri = mediaUrl(source)
    const player = useAudioPlayer(uri ? { uri } : null)
    const status = useAudioPlayerStatus(player)

    useEffect(() => {
        // Sans cette option, l'audio reste muet quand l'iPhone est en mode
        // silencieux — ce qui est contre-intuitif pour un dictionnaire parlé.
        setAudioModeAsync({ playsInSilentMode: true }).catch(() => {})
    }, [])

    if (!uri) return null

    const playing = status?.playing ?? false
    const buffering = !!(status && !status.isLoaded && playing)

    const handlePress = () => {
        if (playing) {
            player.pause()
            return
        }
        // Relire depuis le début : sans ce seek, un second appui après la fin
        // de la lecture ne redémarre pas le son.
        player.seekTo(0)
        player.play()
    }

    return (
        <Pressable
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={({ pressed }) => [
                styles.button,
                compact && styles.compact,
                pressed && styles.pressed,
            ]}
        >
            {buffering ? (
                <ActivityIndicator size="small" color={colors.dark} />
            ) : (
                <Ionicons
                    name={playing ? 'pause' : 'volume-high'}
                    size={compact ? 16 : 18}
                    color={colors.dark}
                />
            )}
            {!compact && <Text style={styles.label}>{label}</Text>}
        </Pressable>
    )
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        alignSelf: 'flex-start',
        backgroundColor: colors.goldLight,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.pill,
    },
    compact: {
        width: 36,
        height: 36,
        paddingVertical: 0,
        paddingHorizontal: 0,
        justifyContent: 'center',
    },
    pressed: {
        opacity: 0.7,
    },
    label: {
        color: colors.dark,
        fontSize: 14,
        fontWeight: '600',
    },
})
