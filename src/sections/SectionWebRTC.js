import React, { useEffect, useState, useRef } from "react";
import { Paper } from "@material-ui/core";
import { Tabs, Tab } from "@material-ui/core";
import { useStreamProvider } from "../api/StreamProvider";
import { pWebRTCOptions } from "../utils/parameters";

import {WebRTC_BrowserEcho} from "../components/WebRTC_BrowserEcho"
import {WebRTC_JanusEcho} from "../components/WebRTC_JanusEcho"


export function SectionWebRTC(props) {

    const [ tabWebRTC, setTabWebRTC ] = useState(pWebRTCOptions.LOCAL);

    const { 
        main_streamVideoCanvas, 
        main_streamSegmentationCanvas,
    } = useStreamProvider();

    const webRTC_SenderVideoRef = useRef(null);
    const webRTC_ReceiverVideoRef = useRef(null);


    return (
        <>
        <div style={{width: '80%', margin: 'auto'}}>
            <Paper elevation={2}>
                <Tabs
                    value={tabWebRTC}
                    onChange={(event, newValue) => { setTabWebRTC(newValue) }}
                    indicatorColor="primary"
                    textColor="primary"
                    style={{
                    width: '90%', 
                    margin: 'auto', 
                    borderBottom: '1px solid #e8e8e8'
                    }}
                    centered
                >
                    <Tab 
                        style={{
                            minWidth: '40%', 
                            fontSize: '15px', 
                            backgroundColor: tabWebRTC === pWebRTCOptions.LOCAL ? 'red' : 'transparent', 
                            color: tabWebRTC === pWebRTCOptions.LOCAL ? 'white' : 'black', 
                            borderTopLeftRadius: '10px', 
                            borderTopRightRadius: '10px',
                            border: tabWebRTC === pWebRTCOptions.LOCAL ? '2px solid #2b56ff' : '1px solid #dddddd'
                        }} 
                        label="WebRTC_ECO: API WebRTC" 
                    />
                    <Tab 
                        style={{
                            minWidth: '40%', 
                            fontSize: '15px', 
                            backgroundColor: tabWebRTC === pWebRTCOptions.JANUS ? 'red' : 'transparent', 
                            color: tabWebRTC === pWebRTCOptions.JANUS ? 'white' : 'black', 
                            borderTopLeftRadius: '10px', 
                            borderTopRightRadius: '10px',
                            border: tabWebRTC === pWebRTCOptions.JANUS ? '2px solid #2b56ff' : '1px solid #dddddd'
                        }} 
                        label="WebRTC_ECO: JANUS" 
                    />
                </Tabs>
            </Paper>


            <Paper elevation={2} style={{ marginTop: '1%' }}>

                { tabWebRTC === pWebRTCOptions.LOCAL && <WebRTC_BrowserEcho/> }
                { tabWebRTC === pWebRTCOptions.JANUS && <WebRTC_JanusEcho/> }

            </Paper>
        </div>
        </>
    )
}