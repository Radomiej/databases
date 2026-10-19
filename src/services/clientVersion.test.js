// @vitest-environment node
import {test,expect} from 'vitest';
import {buildClientVersion} from '../../server/clientVersion.js';
test('build identifies application version and exact Vercel revision',()=>{expect(buildClientVersion({VERCEL_GIT_COMMIT_SHA:'abcdef0123456789'})).toMatch(/^\d+\.\d+\.\d+\+abcdef012345$/);});
