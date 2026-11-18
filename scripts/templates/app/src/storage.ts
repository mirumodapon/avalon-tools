import { appDatabaseName, storageKey } from '@avalon/storage'

/** This app's namespace: localStorage `avalon:__ID__:*`, IndexedDB `avalon-__ID__`. */
export const APP_ID = '__ID__'
export const key = (name: string) => storageKey(APP_ID, name)
export const DB_NAME = appDatabaseName(APP_ID)
