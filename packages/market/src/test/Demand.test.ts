import { assert } from 'chai';

import { Configuration } from '@energyweb/utils-general';

import { DemandStatus } from '@energyweb/origin-backend-core';
import * as Demand from '../blockchain-facade/Demand';

describe('Demand tests', () => {
    const testDemands = [
        { status: DemandStatus.ACTIVE },
        { status: DemandStatus.ACTIVE },
        { status: DemandStatus.ARCHIVED }
    ];

    let oldGetAllDemands: any;

    before(() => {
        oldGetAllDemands = Demand.getAllDemands;
        (Demand as any).getAllDemands = async () => testDemands;
    });

    after(() => {
        (Demand as any).getAllDemands = oldGetAllDemands;
    });

    it('should return demand with given status', async () => {
        const config = {} as Configuration.Entity;

        const activeDemands = await Demand.filterDemandBy(config, {
            status: DemandStatus.ACTIVE
        });

        assert.equal(activeDemands.length, 2);

        const archivedDemands = await Demand.filterDemandBy(config, {
            status: DemandStatus.ARCHIVED
        });

        assert.equal(archivedDemands.length, 1);
    });
});
