'use strict';

import { ChampionggApi } from './services';

const ggApi = new ChampionggApi("output.txt");

ggApi.convertToHtml();
