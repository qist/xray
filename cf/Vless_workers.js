// <!--GAMFC-->version base on commit 43fad05dcdae3b723c53c226f8181fc5bd47223e, time is 2023-06-22 15:20:02 UTC<!--GAMFC-END-->.
// @ts-ignore
import { connect } from 'cloudflare:sockets';

// How to generate your own UUID:
// [Windows] Press "Win + R", input cmd and run:  Powershell -NoExit -Command "[guid]::NewGuid()"
let userID = '0aebbc46-f0bd-4cf0-9fcc-d579ccfc988d';

const proxyIPs = ['cdn-all.xn--b6gac.eu.org', 'cdn.xn--b6gac.eu.org', 'cdn-b100.xn--b6gac.eu.org', 'edgetunnel.anycast.eu.org', 'cdn.anycast.eu.org'];
const cn_hostnames = [''];

let proxyIP = proxyIPs[Math.floor(Math.random() * proxyIPs.length)];

if (!isValidUUID(userID)) {
    throw new Error('uuid is not valid');
}

export default {
    async fetch(request, env, ctx) {
        try {
            userID = env.uuid || userID;
            proxyIP = env.proxyip || proxyIP;
            const upgradeHeader = request.headers.get('Upgrade');
            if (!upgradeHeader || upgradeHeader !== 'websocket') {
                const url = new URL(request.url);
                switch (url.pathname) {
                    case '/cf':
                        return new Response(JSON.stringify(request.cf, null, 4), {
                            status: 200,
                            headers: {
                                "Content-Type": "application/json;charset=utf-8",
                            },
                        });

                    case `/${userID}`: {
                        const vsConfig = getVSConfig(userID, request.headers.get('Host'));
                        return new Response(`${vsConfig}`, {
                            status: 200,
                            headers: {
                                "Content-Type": "text/plain;charset=utf-8",
                            }
                        });
                    }
                    default:
                        // return new Response('Not found', { status: 404 });
                        // For any other path, reverse proxy to 'maimai.sega.jp' and return the original response
                        url.hostname = 'maimai.sega.jp';
                        url.protocol = 'https:';
                        request = new Request(url, request);
                        return await fetch(request);
                }
            } else {
                return await vsOverWSHandler(request);
            }
        } catch (err) {
			/** @type {Error} */ let e = err;
            return new Response(e.toString());
        }
    },
};

async function vsOverWSHandler(request) {

    const webSocketPair = new WebSocketPair();
    const [client, webSocket] = Object.values(webSocketPair);

    webSocket.accept();

    let address = '';
    let portWithRandomLog = '';
    const log = (/** @type {string} */ info, /** @type {string | undefined} */ event) => {
        console.log(`[${address}:${portWithRandomLog}] ${info}`, event || '');
    };
    const earlyDataHeader = request.headers.get('sec-websocket-protocol') || '';

    const readableWebSocketStream = makeReadableWebSocketStream(webSocket, earlyDataHeader, log);

    /** @type {{ value: import("@cloudflare/workers-types").Socket | null}}*/
    let remoteSocketWapper = {
        value: null,
    };
    let udpStreamWrite = null;
    let isDns = false;

    // ws --> remote
    readableWebSocketStream.pipeTo(new WritableStream({
        async write(chunk, controller) {
            if (isDns && udpStreamWrite) {
                return udpStreamWrite(chunk);
            }
            if (remoteSocketWapper.value) {
                const writer = remoteSocketWapper.value.writable.getWriter()
                await writer.write(chunk);
                writer.releaseLock();
                return;
            }

            const {
                hasError,
                message,
                portRemote = 443,
                addressRemote = '',
                rawDataIndex,
                vsVersion = new Uint8Array([0, 0]),
                isUDP,
            } = await processVlessHeader(chunk, userID);
            address = addressRemote;
            portWithRandomLog = `${portRemote}--${Math.random()} ${isUDP ? 'udp ' : 'tcp '
                } `;
            if (hasError) {
                // controller.error(message);
                throw new Error(message); // cf seems has bug, controller.error will not end stream
                // webSocket.close(1000, message);
                return;
            }
            // if UDP but port not DNS port, close it
            if (isUDP) {
                if (portRemote === 53) {
                    isDns = true;
                } else {
                    // controller.error('UDP proxy only enable for DNS which is port 53');
                    throw new Error('UDP proxy only enable for DNS which is port 53'); // cf seems has bug, controller.error will not end stream
                    return;
                }
            }
            // ["version", "附加信息长度 N"]
            const vsResponseHeader = new Uint8Array([vsVersion[0], 0]);
            const rawClientData = chunk.slice(rawDataIndex);

            // TODO: support udp here when cf runtime has udp support
            if (isDns) {
                const { write } = await handleUDPOutBound(webSocket, vsResponseHeader, log);
                udpStreamWrite = write;
                udpStreamWrite(rawClientData);
                return;
            }
            handleTCPOutBound(remoteSocketWapper, addressRemote, portRemote, rawClientData, webSocket, vsResponseHeader, log);
        },
        close() {
            log(`readableWebSocketStream is close`);
        },
        abort(reason) {
            log(`readableWebSocketStream is abort`, JSON.stringify(reason));
        },
    })).catch((err) => {
        log('readableWebSocketStream pipeTo error', err);
    });

    return new Response(null, {
        status: 101,
        // @ts-ignore
        webSocket: client,
    });
}
async function checkUuidInApiResponse(targetUuid) {
    // Check if any of the environment variables are empty


    try {
        const apiResponse = await getApiResponse();
        if (!apiResponse) {
            return false;
        }
        const isUuidInResponse = apiResponse.users.some(user => user.uuid === targetUuid);
        return isUuidInResponse;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}


async function handleTCPOutBound(remoteSocket, addressRemote, portRemote, rawClientData, webSocket, vsResponseHeader, log,) {
    async function connectAndWrite(address, port) {
        /** @type {import("@cloudflare/workers-types").Socket} */
        const tcpSocket = connect({
            hostname: address,
            port: port,
        });
        remoteSocket.value = tcpSocket;
        log(`connected to ${address}:${port}`);
        const writer = tcpSocket.writable.getWriter();
        await writer.write(rawClientData); // first write, nomal is tls client hello
        writer.releaseLock();
        return tcpSocket;
    }

    // if the cf connect tcp socket have no incoming data, we retry to redirect ip
    async function retry() {
        const tcpSocket = await connectAndWrite(proxyIP || addressRemote, portRemote)
        // no matter retry success or not, close websocket
        tcpSocket.closed.catch(error => {
            console.log('retry tcpSocket closed error', error);
        }).finally(() => {
            safeCloseWebSocket(webSocket);
        })
        remoteSocketToWS(tcpSocket, webSocket, vsResponseHeader, null, log);
    }

    const tcpSocket = await connectAndWrite(addressRemote, portRemote);

    // when remoteSocket is ready, pass to websocket
    // remote--> ws
    remoteSocketToWS(tcpSocket, webSocket, vsResponseHeader, retry, log);
}

function makeReadableWebSocketStream(webSocketServer, earlyDataHeader, log) {
    let readableStreamCancel = false;
    const stream = new ReadableStream({
        start(controller) {
            webSocketServer.addEventListener('message', (event) => {
                if (readableStreamCancel) {
                    return;
                }
                const message = event.data;
                controller.enqueue(message);
            });

            // The event means that the client closed the client -> server stream.
            // However, the server -> client stream is still open until you call close() on the server side.
            // The WebSocket protocol says that a separate close message must be sent in each direction to fully close the socket.
            webSocketServer.addEventListener('close', () => {
                // client send close, need close server
                // if stream is cancel, skip controller.close
                safeCloseWebSocket(webSocketServer);
                if (readableStreamCancel) {
                    return;
                }
                controller.close();
            }
            );
            webSocketServer.addEventListener('error', (err) => {
                log('webSocketServer has error');
                controller.error(err);
            }
            );
            // for ws 0rtt
            const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
            if (error) {
                controller.error(error);
            } else if (earlyData) {
                controller.enqueue(earlyData);
            }
        },

        pull(controller) {
            // if ws can stop read if stream is full, we can implement backpressure
            // https://streams.spec.whatwg.org/#example-rs-push-backpressure
        },
        cancel(reason) {
            // 1. pipe WritableStream has error, this cancel will called, so ws handle server close into here
            // 2. if readableStream is cancel, all controller.close/enqueue need skip,
            // 3. but from testing controller.error still work even if readableStream is cancel
            if (readableStreamCancel) {
                return;
            }
            log(`ReadableStream was canceled, due to ${reason}`)
            readableStreamCancel = true;
            safeCloseWebSocket(webSocketServer);
        }
    });

    return stream;

}

// https://xtls.github.io/development/protocols/vs.html
// https://github.com/zizifn/excalidraw-backup/blob/main/v2ray-protocol.excalidraw


async function processVlessHeader(
    vsBuffer,
    userID
) {
    if (vsBuffer.byteLength < 24) {
        return {
            hasError: true,
            message: 'invalid data',
        };
    }
    const version = new Uint8Array(vsBuffer.slice(0, 1));
    let isValidUser = false;
    let isUDP = false;
    const slicedBuffer = new Uint8Array(vsBuffer.slice(1, 17));
    const slicedBufferString = stringify(slicedBuffer);

    const uuids = userID.includes(',') ? userID.split(",") : [userID];

    const checkUuidInApi = await checkUuidInApiResponse(slicedBufferString);
    isValidUser = uuids.some(userUuid => checkUuidInApi || slicedBufferString === userUuid.trim());

    console.log(`checkUuidInApi: ${await checkUuidInApiResponse(slicedBufferString)}, userID: ${slicedBufferString}`);

    if (!isValidUser) {
        return {
            hasError: true,
            message: 'invalid user',
        };
    }

    const optLength = new Uint8Array(vsBuffer.slice(17, 18))[0];
    //skip opt for now

    const command = new Uint8Array(
        vsBuffer.slice(18 + optLength, 18 + optLength + 1)
    )[0];

    // 0x01 TCP
    // 0x02 UDP
    // 0x03 MUX
    if (command === 1) {
    } else if (command === 2) {
        isUDP = true;
    } else {
        return {
            hasError: true,
            message: `command ${command} is not support, command 01-tcp,02-udp,03-mux`,
        };
    }
    const portIndex = 18 + optLength + 1;
    const portBuffer = vsBuffer.slice(portIndex, portIndex + 2);
    // port is big-Endian in raw data etc 80 == 0x005d
    const portRemote = new DataView(portBuffer).getUint16(0);

    let addressIndex = portIndex + 2;
    const addressBuffer = new Uint8Array(
        vsBuffer.slice(addressIndex, addressIndex + 1)
    );

    // 1--> ipv4  addressLength =4
    // 2--> domain name addressLength=addressBuffer[1]
    // 3--> ipv6  addressLength =16
    const addressType = addressBuffer[0];
    let addressLength = 0;
    let addressValueIndex = addressIndex + 1;
    let addressValue = '';
    switch (addressType) {
        case 1:
            addressLength = 4;
            addressValue = new Uint8Array(
                vsBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
            ).join('.');
            break;
        case 2:
            addressLength = new Uint8Array(
                vsBuffer.slice(addressValueIndex, addressValueIndex + 1)
            )[0];
            addressValueIndex += 1;
            addressValue = new TextDecoder().decode(
                vsBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
            );
            break;
        case 3:
            addressLength = 16;
            const dataView = new DataView(
                vsBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
            );
            // 2001:0db8:85a3:0000:0000:8a2e:0370:7334
            const ipv6 = [];
            for (let i = 0; i < 8; i++) {
                ipv6.push(dataView.getUint16(i * 2).toString(16));
            }
            addressValue = ipv6.join(':');
            // seems no need add [] for ipv6
            break;
        default:
            return {
                hasError: true,
                message: `invild  addressType is ${addressType}`,
            };
    }
    if (!addressValue) {
        return {
            hasError: true,
            message: `addressValue is empty, addressType is ${addressType}`,
        };
    }

    return {
        hasError: false,
        addressRemote: addressValue,
        addressType,
        portRemote,
        rawDataIndex: addressValueIndex + addressLength,
        vsVersion: version,
        isUDP,
    };
}

async function remoteSocketToWS(remoteSocket, webSocket, vsResponseHeader, retry, log) {
    // remote--> ws
    let remoteChunkCount = 0;
    let chunks = [];
    /** @type {ArrayBuffer | null} */
    let vsHeader = vsResponseHeader;
    let hasIncomingData = false; // check if remoteSocket has incoming data
    await remoteSocket.readable
        .pipeTo(
            new WritableStream({
                start() {
                },
                async write(chunk, controller) {
                    hasIncomingData = true;
                    // remoteChunkCount++;
                    if (webSocket.readyState !== WS_READY_STATE_OPEN) {
                        controller.error(
                            'webSocket.readyState is not open, maybe close'
                        );
                    }
                    if (vsHeader) {
                        webSocket.send(await new Blob([vsHeader, chunk]).arrayBuffer());
                        vsHeader = null;
                    } else {
                        // seems no need rate limit this, CF seems fix this??..
                        // if (remoteChunkCount > 20000) {
                        // 	// cf one package is 4096 byte(4kb),  4096 * 20000 = 80M
                        // 	await delay(1);
                        // }
                        webSocket.send(chunk);
                    }
                },
                close() {
                    log(`remoteConnection!.readable is close with hasIncomingData is ${hasIncomingData}`);
                    // safeCloseWebSocket(webSocket); // no need server close websocket frist for some case will casue HTTP ERR_CONTENT_LENGTH_MISMATCH issue, client will send close event anyway.
                },
                abort(reason) {
                    console.error(`remoteConnection!.readable abort`, reason);
                },
            })
        )
        .catch((error) => {
            console.error(
                `remoteSocketToWS has exception `,
                error.stack || error
            );
            safeCloseWebSocket(webSocket);
        });

    // seems is cf connect socket have error,
    // 1. Socket.closed will have error
    // 2. Socket.readable will be close without any data coming
    if (hasIncomingData === false && retry) {
        log(`retry`)
        retry();
    }
}

function base64ToArrayBuffer(base64Str) {
    if (!base64Str) {
        return { error: null };
    }
    try {
        // go use modified Base64 for URL rfc4648 which js atob not support
        base64Str = base64Str.replace(/-/g, '+').replace(/_/g, '/');
        const decode = atob(base64Str);
        const arryBuffer = Uint8Array.from(decode, (c) => c.charCodeAt(0));
        return { earlyData: arryBuffer.buffer, error: null };
    } catch (error) {
        return { error };
    }
}

function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

const WS_READY_STATE_OPEN = 1;
const WS_READY_STATE_CLOSING = 2;
function safeCloseWebSocket(socket) {
    try {
        if (socket.readyState === WS_READY_STATE_OPEN || socket.readyState === WS_READY_STATE_CLOSING) {
            socket.close();
        }
    } catch (error) {
        console.error('safeCloseWebSocket error', error);
    }
}

const byteToHex = [];
for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
    return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}
function stringify(arr, offset = 0) {
    const uuid = unsafeStringify(arr, offset);
    if (!isValidUUID(uuid)) {
        throw TypeError("Stringified UUID is invalid");
    }
    return uuid;
}

async function handleUDPOutBound(webSocket, vsResponseHeader, log) {

    let isVlessHeaderSent = false;
    const transformStream = new TransformStream({
        start(controller) {

        },
        transform(chunk, controller) {
            // udp message 2 byte is the the length of udp data
            // TODO: this should have bug, beacsue maybe udp chunk can be in two websocket message
            for (let index = 0; index < chunk.byteLength;) {
                const lengthBuffer = chunk.slice(index, index + 2);
                const udpPakcetLength = new DataView(lengthBuffer).getUint16(0);
                const udpData = new Uint8Array(
                    chunk.slice(index + 2, index + 2 + udpPakcetLength)
                );
                index = index + 2 + udpPakcetLength;
                controller.enqueue(udpData);
            }
        },
        flush(controller) {
        }
    });

    // only handle dns udp for now
    transformStream.readable.pipeTo(new WritableStream({
        async write(chunk) {
            const resp = await fetch(dohURL, // dns server url
                {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/dns-message',
                    },
                    body: chunk,
                })
            const dnsQueryResult = await resp.arrayBuffer();
            const udpSize = dnsQueryResult.byteLength;
            // console.log([...new Uint8Array(dnsQueryResult)].map((x) => x.toString(16)));
            const udpSizeBuffer = new Uint8Array([(udpSize >> 8) & 0xff, udpSize & 0xff]);
            if (webSocket.readyState === WS_READY_STATE_OPEN) {
                log(`doh success and dns message length is ${udpSize}`);
                if (isVlessHeaderSent) {
                    webSocket.send(await new Blob([udpSizeBuffer, dnsQueryResult]).arrayBuffer());
                } else {
                    webSocket.send(await new Blob([vsResponseHeader, udpSizeBuffer, dnsQueryResult]).arrayBuffer());
                    isVlessHeaderSent = true;
                }
            }
        }
    })).catch((error) => {
        log('dns udp has error' + error)
    });

    const writer = transformStream.writable.getWriter();

    return {
        write(chunk) {
            writer.write(chunk);
        }
    };
}


function getVSConfig(userID, hostName) {
    const wvlessws = `vless://${userID}\u0040${hostName}:80?encryption=none&security=none&type=ws&host=${hostName}&path=%2F%3Fed%3D2560#${hostName}`;
    const pvlesswstls = `vless://${userID}\u0040${hostName}:443?encryption=none&security=tls&type=ws&host=${hostName}&sni=${hostName}&fp=random&path=%2F%3Fed%3D2560#${hostName}`;
    const note = `正在使用的ProxyIP：${proxyIP}`;
    if (hostName.includes('pages.dev')) {
        return `
==========================配置详解==============================
${note}
################################################################
CF-pages-vless+ws+tls节点，分享链接如下：

${pvlesswstls}

---------------------------------------------------------------
注意：如果 ${hostName} 在本地网络打不开（中国移动用户注意），客户端必须开启切片功能
---------------------------------------------------------------
客户端必要文明参数如下：
客户端地址(address)：自定义的域名 或者 优选域名 或者 优选IP（反代IP必须与反代端口对应）
端口(port)：6个https端口可任意选择(443、8443、2053、2083、2087、2096)
用户ID(uuid)：${userID}
传输协议(network)：ws 或者 websocket
伪装域名(host)：${hostName}
路径(path)：/?ed=2560
传输安全(TLS)：开启
跳过证书验证(allowlnsecure)：false
################################################################
`;
    } else {
        return `
==========================配置详解==============================
${note}
################################################################
一、CF-workers-vless+ws节点，分享链接如下：

${wvlessws}

---------------------------------------------------------------
注意：当前节点无需使用CF解析完成的域名，客户端选项的TLS选项必须关闭
---------------------------------------------------------------
客户端必要文明参数如下：
客户端地址(address)：自定义的域名 或者 优选域名 或者 优选IP（反代IP必须与反代端口对应）
端口(port)：7个http端口可任意选择(80、8080、8880、2052、2082、2086、2095)
用户ID(uuid)：${userID}
传输协议(network)：ws 或者 websocket
伪装域名(host)：${hostName}
路径(path)：/?ed=2560
################################################################

################################################################
二、CF-workers-vless+ws+tls 或者 CF-pages-vless+ws+tls节点，分享链接如下：

${pvlesswstls}

---------------------------------------------------------------
注意：使用workers域名开启TLS，客户端必须开启切片功能
---------------------------------------------------------------
客户端必要文明参数如下：
客户端地址(address)：自定义的域名 或者 优选域名 或者 优选IP（反代IP必须与反代端口对应）
端口(port)：6个https端口可任意选择(443、8443、2053、2083、2087、2096)
用户ID(uuid)：${userID}
传输协议(network)：ws 或者 websocket
伪装域名(host)：${hostName}
路径(path)：/?ed=2560
传输安全(TLS)：开启
跳过证书验证(allowlnsecure)：false
################################################################
----------------------------------------------------------------
################################################################
clash-meta
---------------------------------------------------------------
  - type: vless
    name: ${hostName}
    server: ${hostName}
    port: 443
    uuid: ${userID}
    network: ws
    tls: true
    udp: true
    servername: ${hostName}
    skip-cert-verify: false
    ws-opts:
      path: "/?ed=2560"
      headers:
        Host: ${hostName}
      max-early-data: 4096
      early-data-header-name: Sec-WebSocket-Protocol
---------------------------------------------------------------
################################################################
`;
    }
}