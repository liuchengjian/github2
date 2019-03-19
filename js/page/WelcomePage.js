/**
 *欢迎页面
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import NavigationUtil from "../navigator/NavigationUtil";

type Props = {};
export default class WelcomePage extends Component<Props> {
    componentDidMount(): void {
        //定时器
        this.timer = setTimeout(()=>{
            //重置到首页
            NavigationUtil.resetToHomPage({
                navigation: this.props.navigation
            })
        },300)
    }
    componentWillMount(): void {
        //防止内存泄漏，关闭在componentWillMount定时器
        this.timer && clearTimeout( this.timer);
    }

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.welcome}>Welcome to React Native!</Text>
                <Text style={styles.instructions}>To get started, edit App.js</Text>
                <Text style={styles.instructions}>你好</Text>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
    },
    welcome: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
    },
    instructions: {
        textAlign: 'center',
        color: '#333333',
        marginBottom: 5,
    },
});
