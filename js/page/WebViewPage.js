/**
 *WebView页面
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View, TouchableOpacity, WebView} from 'react-native';
import NavigationBar from '../common/NavigationBar'
import ViewUtil from "../util/ViewUtil";

import NavigationUtil from "../navigator/NavigationUtil";
import BackPressComponent from "../common/BackPressComponent";

const THEME_COLOR = "blue";
type Props = {};
export default class DetailPage extends Component<Props> {
    constructor(props) {
        super(props);
        this.params = this.props.navigation.state.params;//导航器取出params
        const {title, url} = this.params;
        this.state = {
            title: title,
            url: url,
            canGoBack: false,//是否可以返回到上一页
        }
        this.backPress = new BackPressComponent({backPress: () => this.onBackPress()});
    }

    componentDidMount() {
        this.backPress.componentDidMount();
    }

    componentWillUnmount() {
        this.backPress.componentWillUnmount();
    }

    onBack() {
        if (this.state.canGoBack) {
            this.webView.goBack();
        } else {
            NavigationUtil.goBack(this.props.navigation);
        }
    }

    onBackPress() {
        this.onBack();
        return true;
    }

    onNavigationStateChange(navState) {
        this.setState({
            canGoBack: navState.canGoBack,//是否可以返回到上一页
            url: navState.url,
        })
    }

    render() {
        const {theme} = this.params;
        let navigationBar = <NavigationBar
            leftButton={ViewUtil.getLeftBackButton(() => this.onBack())}
            title={this.state.title}
            style={theme.styles.navBar}
        />;
        return (
            <View style={styles.container}>
                {navigationBar}
                <WebView
                    ref={webView => this.webView = webView}
                    startInLoadingState={true}//开始加载进度条
                    onNavigationStateChange={e => this.onNavigationStateChange(e)}
                    source={{uri: this.state.url}}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

});
