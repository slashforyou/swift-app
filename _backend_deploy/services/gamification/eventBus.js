/**
 * Gamification Event Bus
 * Singleton EventEmitter — émet les événements métier → ruleEngine
 */
const EventEmitter = require('events');

const bus = new EventEmitter();
bus.setMaxListeners(50);

let _ruleEngine = null;

/**
 * Émet un événement métier gamification
 * @param {string} eventType  Ex: 'job.completed', 'photo.added'
 * @param {Object} payload    Données de l'événement
 */
function emit(eventType, payload) {
  const event = {
    type: eventType,
    ...payload,
    timestamp: new Date().toISOString(),
  };
  // Fire-and-forget : ne bloque pas l'endpoint appelant
  setImmediate(() => {
    bus.emit('gamification_event', event);
  });
}

/**
 * Enregistre le ruleEngine comme listener principal
 * Appelé une seule fois au démarrage du serveur
 */
function registerListeners(ruleEngine) {
  if (_ruleEngine) return; // déjà enregistré
  _ruleEngine = ruleEngine;

  bus.on('gamification_event', async (event) => {
    try {
      await ruleEngine.processEvent(event);
    } catch (err) {
      console.error('[Gamification] Error processing event:', event.type, err.message);
    }
  });
}

module.exports = { emit, registerListeners };
