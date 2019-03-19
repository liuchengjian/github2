/**
 *详情页面
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View, TouchableOpacity, WebView} from 'react-native';
import NavigationBar from '../common/NavigationBar'
import ViewUtil from "../util/ViewUtil";

const TRENDING_URL = 'https://github.com/';
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import NavigationUtil from "../navigator/NavigationUtil";
import BackPressComponent from "../common/BackPressComponent";
import FavoriteDao from "../expand/dao/FavoriteDao";

const THEME_COLOR = "blue";
type Props = {};
export default class DetailPage extends Component<Props> {
    constructor(props) {
        super(props);
        this.params = this.props.navigation.state.params;//导航器取出params
        const {projectModel, flag} = this.params;
        this.WebViewPage = new FavoriteDao(flag);
        this.url = projectModel.item.html_url || TRENDING_URL + projectModel.item.fullName;
        const title = projectModel.item.full_name || projectModel.item.fullName;//根据最热和趋势得不同
        this.state = {
            title: title,
            url: this.url,
            canGoBack: false,//是否可以返回到上一页
            isFavorite: projectModel.isFavorite,//收藏状态
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

    //收藏按钮得点击事件
    onFavoriteButtonClick() {
        const {projectModel,callback} = this.params;
        const isFavorite = projectModel.isFavorite = !projectModel.isFavorite;//取反
        callback(isFavorite);//更新Item的收藏状态
        this.setState({
            isFavorite:isFavorite,//改变收藏状态
        });
        let key = projectModel.item.fullName ? projectModel.item.fullName : projectModel.item.id.toString();
        if( projectModel.isFavorite){
            this.favoriteDao.saveFavoriteItem(key,JSON.stringify(projectModel.item))
        }else {
            this.favoriteDao.removeFavoriteItem(key)
        }
    }

    //右边按钮
    renderRightButton() {
        return (<View style={{flexDirection: 'row'}}>
                <TouchableOpacity
                    onPress={() => this.onFavoriteButtonClick()}>
                    <FontAwesome
                        name={this.state.isFavorite ? 'star' : 'star-o'}
                        size={20}
                        style={{color: 'white', marginRight: 10}}
                    />
                </TouchableOpacity>
                {ViewUtil.getShareButton(() => {

                })}
            </View>
        )
    }

    onNavigationStateChange(navState) {
        this.setState({
            canGoBack: navState.canGoBack,//是否可以返回到上一页
            url: navState.url,
        })
    }

    render() {
        const {theme}=this.params;
        const titleLayoutStyle = this.state.title.length > 20 ? {paddingRight: 30} : null;//放在标题过长
        let navigationBar = <NavigationBar
            leftButton={ViewUtil.getLeftBackButton(() => this.onBack())}
            titleLayoutStyle={titleLayoutStyle}
            title={this.state.title}
            style={theme.styles.navBar}
            rightButton={this.renderRightButton()}
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
