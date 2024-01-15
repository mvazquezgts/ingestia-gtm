import React, { useEffect, useState, useRef } from "react";
import adapter from 'webrtc-adapter'
import { HomeWrapper } from "../components/utils/HomeWrapper";
import { pSectionActivatedOptions } from "../utils/parameters";
import { SectionNavegation } from "../components/SectionNavegation"
import { SectionSettings } from "../components/SectionSettings"
window.adapter = adapter;

import { SectionVideo } from "../sections/SectionVideo"
import { SectionWebRTC } from "../sections/SectionWebRTC"
import { SectionBenchmarking } from "../sections/SectionBenchmarking"

export function Home() {
    
    const [sectionActivated, setSectionActivated] = useState(pSectionActivatedOptions.VIDEO);

    return (
        <>
            <HomeWrapper style={{minHeight: '600px'}}>
                <SectionNavegation sectionActivated={sectionActivated} setSectionActivated={setSectionActivated}/>
                <SectionSettings sectionActivated={sectionActivated}/>

                { sectionActivated === pSectionActivatedOptions.VIDEO && <SectionVideo/> }
                { sectionActivated === pSectionActivatedOptions.WEBRTC && <SectionWebRTC/> }
                { sectionActivated === pSectionActivatedOptions.EVALUATION && <SectionBenchmarking/> }

                {/* <SourceSelection videoElementRef={videoElementRef} videoHeight={videoHeight} videoWidth={videoWidth}/> */}
            </HomeWrapper>

        </>

    );
}