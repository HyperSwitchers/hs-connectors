// @ts-check

import { atom } from 'recoil';
import {
  DEFAULT_APP_CONTEXT,
  DEFAULT_CONNECTOR,
  DEFAULT_TRANSFORMER_STATE,
  defaultConnectorProps,
} from './constants';

export const APP_CONTEXT = atom({
  key: 'context',
  default: DEFAULT_APP_CONTEXT,
});

export const FLOWS = atom({
  key: 'flows',
  default: {},
});

export const TRANSFORMER_STATE = atom({
  key: 'transformer',
  default: DEFAULT_TRANSFORMER_STATE,
});

export const PROP_STATE = atom({
  key: 'prop',
  default: defaultConnectorProps(DEFAULT_CONNECTOR),
});
