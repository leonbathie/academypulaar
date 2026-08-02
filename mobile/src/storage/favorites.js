import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'favorites:words'

// On stocke l'entrée complète, pas seulement l'id : les favoris doivent
// rester consultables hors-ligne sans aucun appel réseau.

export async function getFavorites() {
    try {
        const raw = await AsyncStorage.getItem(KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

export async function isFavorite(id) {
    const list = await getFavorites()
    return list.some(entry => entry.id === id)
}

export async function addFavorite(entry) {
    const list = await getFavorites()
    if (list.some(item => item.id === entry.id)) return list
    const next = [entry, ...list]
    await AsyncStorage.setItem(KEY, JSON.stringify(next))
    return next
}

export async function removeFavorite(id) {
    const list = await getFavorites()
    const next = list.filter(entry => entry.id !== id)
    await AsyncStorage.setItem(KEY, JSON.stringify(next))
    return next
}

// Renvoie le nouvel état (true = désormais en favori) pour que l'appelant
// mette à jour son icône sans relire le stockage.
export async function toggleFavorite(entry) {
    const list = await getFavorites()
    const exists = list.some(item => item.id === entry.id)
    if (exists) {
        await removeFavorite(entry.id)
        return false
    }
    await addFavorite(entry)
    return true
}
