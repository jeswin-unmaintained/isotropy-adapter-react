/* @flow */
import React from "react";
import ReactDOM from "react-dom";
import ReactDOMServer from "react-dom/server";
import IsomorphicRelay from "isomorphic-relay";
import Relay from 'react-relay';
import RelayStoreData from 'react-relay/lib/RelayStoreData';

import type { KoaContextType } from "./flow/koa-types";

export type ReactAdapterOptionsType = {
    renderToStaticMarkup?: boolean,
    toHtml: (html: string, props: Object) => string
}

export type RenderArgsType = {
    component: Function,
    args: Object,
    context: KoaContextType,
    options: ReactAdapterOptionsType
}

export type RenderRelayContainerArgsType = {
    relayContainer: Function,
    relayRoute: Object,
    args: Object,
    graphqlUrl: string,
    context: KoaContextType,
    options: ReactAdapterOptionsType
}

const render = function(params: RenderArgsType) : void {
    const { component, args, context } = params;
    const options = params.options || {};

    const reactElement = React.createElement(component, args);
    const toHtml = options.toHtml || ((x, args) => x);
    const renderToStaticMarkup = (typeof options.renderToStaticMarkup !== "undefined" && options.renderToStaticMarkup !== null) ? options.renderToStaticMarkup : false;
    const html = !renderToStaticMarkup ? ReactDOMServer.renderToString(reactElement) : ReactDOMServer.renderToStaticMarkup(reactElement);
    context.body = toHtml(html, args);
};


const renderRelayContainer = async function(params: RenderRelayContainerArgsType) : Promise {
    const { relayContainer, relayRoute, args, context, graphqlUrl, options } = params;

    const _relayRoute = Object.assign({}, relayRoute);
    _relayRoute.params = Object.assign({}, relayRoute.params, args);

    const rootContainerProps = {
        Component: relayContainer,
        route: _relayRoute
    };

    Relay.injectNetworkLayer(new Relay.DefaultNetworkLayer(graphqlUrl));
    RelayStoreData.getDefaultInstance().getChangeEmitter().injectBatchingStrategy(() => {});

    return IsomorphicRelay.prepareData(rootContainerProps).then(data => {
        const toHtml = options.toHtml || ((x, args) => x);
        const renderToStaticMarkup = (typeof options.renderToStaticMarkup !== "undefined" && options.renderToStaticMarkup !== null) ? options.renderToStaticMarkup : false;
        const relayElement = <IsomorphicRelay.RootContainer {...rootContainerProps} />;
        const html = !renderToStaticMarkup ? ReactDOMServer.renderToString(relayElement) : ReactDOMServer.renderToStaticMarkup(relayElement);
        context.body = toHtml(html, args);
    });
};


export default {
    render,
    renderRelayContainer
};
