/**
 *最热页面
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View, FlatList, RefreshControl, ActivityIndicator} from 'react-native';
import {createMaterialTopTabNavigator, createAppContainer} from "react-navigation";
import {connect} from 'react-redux';
import NavigationBar from '../common/NavigationBar';
import actions from '../action/index'
import PopularItem from '../common/PopularItem'
import Toast from 'react-native-easy-toast'
import NavigationUtil from "../navigator/NavigationUtil";
import {FLAG_STORAGE} from "../expand/dao/DataStore";
import FavoriteDao from "../expand/dao/FavoriteDao";
import FavoriteUtil from "../common/FavoriteUtil";
import EventBus from "react-native-event-bus";
import EventTypes from "../util/EventTypes";
import {FLAG_LANGUAGE} from "../expand/dao/LanguageDao";

const favoriteDao = new FavoriteDao(FLAG_STORAGE.flag_popular);
const URL = 'https://api.github.com/search/repositories?q=';
const QUERY_STR = '&sort=stars';


type Props = {};

class PopularPage extends Component<Props> {
    constructor(props) {
        super(props);
        const {onLoadLanguage} = this.props;
        this.isFavoriteChanged = false;
        onLoadLanguage(FLAG_LANGUAGE.flag_key);
    }

    _genTabs() {
        const tabs = {};
        const {keys, theme} = this.props;
        keys.forEach((item, index) => {
            if (item.checked) {//显示选中的
                tabs[`tab${index}`] = {
                    screen: props => <PopularTabPage {...props} tabLabel={item.name} theme={theme}/>,
                    navigationOptions: {
                        title: item.name
                    }
                }
            }
        });
        return tabs;
    }

    render() {
        const {keys, theme} = this.props;
        let statusBar = {
            backgroundColor: theme.themeColor,
            barStyle: "light-content",

        };
        let navigationBar = <NavigationBar
            title={"最热"}
            statusBar={statusBar}
            style={theme.styles.navBar}
        />;
        const TabNavigator = keys.length ? createAppContainer(createMaterialTopTabNavigator(
            this._genTabs(), {
                tabBarOptions: {
                    //设置顶部导航栏样式
                    tabStyle: styles.tabStyle,
                    upperCaseLabel: false,//是否使标签大写，默认为true
                    scrollEnabled: true,//是否支持 选项卡滚动，默认false
                    style: {
                        backgroundColor: theme.themeColor,
                        height: 30,
                    },
                    indicatorStyle: styles.indicatorStyle,//标签指示器的样式
                    labelStyle: styles.labelStyle,//文字的样式

                }, lazy: true
            }
        )) : null;
        return (
            <View style={styles.container}>
                {navigationBar}
                {TabNavigator && <TabNavigator/>}
            </View>
        );
    }
}

const mapPopularStateToProps = state => ({
    keys: state.language.keys,
    theme: state.theme.theme,
});

const mapPopularDispatchToProps = dispatch => ({
    onLoadLanguage: (flag) => dispatch(actions.onLoadLanguage(flag))
});
//注意：connect只是个function，并不应定非要放在export后面
export default connect(mapPopularStateToProps, mapPopularDispatchToProps)(PopularPage);


const pageSize = 10;//设为常量，防止修改
class PopularTab extends Component<Props> {
    constructor(props) {
        super(props)
        const {tabLabel} = this.props;
        this.storeName = tabLabel;
    }

    componentDidMount(): void {
        this.loadData(false);

        EventBus.getInstance().addListener(EventTypes.favorite_changed_popular, this.favoriteChangeListener = () => {
            this.isFavoriteChanged = true;
        });
        EventBus.getInstance().addListener(EventTypes.bottom_tab_select, this.bottomTabSelectListener = (data) => {
            if (data.to === 0 && this.isFavoriteChanged) {
                this.loadData(null, true);
            }
        })
    }

    /**
     * 获取数据
     */
    loadData(loadMore, refreshFavorite) {
        const {onRefreshPopular, onLoadMorePopular, onFlushPopularFavorite} = this.props;
        const store = this._store();

        const url = this.genFetchUrl(this.storeName);
        if (loadMore) {
            onLoadMorePopular(this.storeName, ++store.pageIndex, pageSize, store.items, favoriteDao, callback => {
                this.refs.toast.show('没有更多了');
            })
        } else if (refreshFavorite) {
            onFlushPopularFavorite(this.storeName, store.pageIndex, pageSize, store.items, favoriteDao);
        } else {
            onRefreshPopular(this.storeName, url, pageSize, favoriteDao)
        }

    }

    componentWillUnmount() {
        EventBus.getInstance().removeListener(this.favoriteChangeListener);
        EventBus.getInstance().removeListener(this.bottomTabSelectListener);
    }

    /**
     * 获取与当前页面有关的数据
     * @returns {*}
     * @private
     */
    _store() {
        const {popular} = this.props;
        let store = popular[this.storeName];
        if (!store) {
            store = {
                items: [],
                isLoading: false,
                projectModels: [],//要显示的数据
                hideLoadingMore: true,//默认隐藏加载更多
            }
        }
        return store;
    }

    /**
     * 底部加载更多布局
     * @returns {null}
     */
    genIndicator() {
        return this._store().hideLoadingMore ? null :
            <View style={styles.indicatorContainer}>
                <ActivityIndicator
                    style={styles.indicator}
                />
                <Text>正在加载更多</Text>
            </View>
    }

    //生成URL
    genFetchUrl(key) {
        return URL + key + QUERY_STR;
    }

    renderItem(data) {
        const item = data.item;
        const {theme} = this.props;
        return <PopularItem
            projectModel={item}
            theme={theme}
            onSelect={(callback) => {
                NavigationUtil.goPage({
                    theme,
                    projectModel: item,
                    flag: FLAG_STORAGE.flag_popular,
                    callback,
                }, 'DetailPage')
            }}
            onFavorite={(item, isFavorite) => FavoriteUtil.onFavorite(favoriteDao, item, isFavorite, FLAG_STORAGE.flag_popular)}//点击收藏时回调

        />
    }

    render() {
        const {theme} = this.props;
        let store = this._store();
        return (
            <View style={styles.container}>
                <FlatList
                    data={store.projectModels}
                    renderItem={data => this.renderItem(data)}
                    keyExtractor={item => "" + item.item.id}
                    refreshControl={
                        <RefreshControl
                            title={'Loading'}
                            titleColor={theme.themeColor}
                            colors={[theme.themeColor]}
                            refreshing={store.isLoading}
                            onRefresh={() => this.loadData()}
                            tintColor={theme.themeColor}
                        />
                    }
                    ListFooterComponent={() => this.genIndicator()}
                    onEndReached={() => {
                        console.log('---onEndReached----');
                        setTimeout(() => {
                            if (this.canLoadMore) {//fix 滚动时两次调用onEndReached https://github.com/facebook/react-native/issues/14015
                                this.loadData(true);
                                this.canLoadMore = false;
                            }
                        }, 100);
                    }}
                    onEndReachedThreshold={0.5}
                    onMomentumScrollBegin={() => {
                        this.canLoadMore = true; //fix 初始化时页调用onEndReached的问题
                        console.log('---onMomentumScrollBegin-----')
                    }}
                />
                <Toast ref={'toast'} position={'center'}/>
            </View>
        );
    }
}

const mapStateToProps = state => ({
    popular: state.popular
});
const mapDispatchToProps = dispatch => ({
    //将 dispatch(onRefreshPopular(storeName, url))绑定到props
    onRefreshPopular: (storeName, url, pageSize, favoriteDao) => dispatch(actions.onRefreshPopular(storeName, url, pageSize, favoriteDao)),
    onLoadMorePopular: (storeName, pageIndex, pageSize, items, favoriteDao, callBack) => dispatch(actions.onLoadMorePopular(storeName, pageIndex, pageSize, items, favoriteDao, callBack)),
    onFlushPopularFavorite: (storeName, pageIndex, pageSize, items, favoriteDao) => dispatch(actions.onFlushPopularFavorite(storeName, pageIndex, pageSize, items, favoriteDao)),

});
//注意：connect只是个function，并不应定非要放在export后面
const PopularTabPage = connect(mapStateToProps, mapDispatchToProps)(PopularTab);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // marginTop:30
    },
    welcome: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
    },
    instructions: {
        textAlign: 'center',
        color: '#333333',
        marginTop: 40,
        marginBottom: 5,
    },
    tabStyle: {
        // minWidth: 50 //fix minWidth会导致tabStyle初次加载时闪烁
        padding: 0,
        // height: 50,
        // width:90,
    },
    indicatorStyle: {
        height: 2,
        backgroundColor: 'white'
    },
    labelStyle: {
        fontSize: 13,
        margin: 0,
    },
    indicatorContainer: {
        alignItems: "center"
    },
    indicator: {
        color: 'red',
        margin: 10
    },

});
