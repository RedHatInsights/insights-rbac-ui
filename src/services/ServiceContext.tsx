/**
 * Service Context - Re-exports from canonical location
 *
 * @deprecated Import from '../contexts/ServiceContext' or '../services/index' instead.
 *
 * This file exists for backward compatibility. The canonical implementation
 * is now in src/contexts/ServiceContext.tsx.
 */

// Re-export everything from the canonical location
export {
  ServiceProvider,
  useAppServices,
  useAxios,
  useNotify,
  type AppServices,
  type NotifyFn,
  type NotificationVariant,
} from '../contexts/ServiceContext';
