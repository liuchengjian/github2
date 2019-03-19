/**
 *最热页面
 */

import React, {Component} from 'react';
import {
    Platform, StyleSheet, Text, View, FlatList, RefreshControl,
    ActivityIndicator, TouchableOpacity, DeviceEventEmitter
} from 'react-native';
import {createMaterialTopTabNavigator, createAppContainer} from "react-navigation";
import {connect} from 'react-redux';
import NavigationBar from '../common/NavigationBar';
import actions from '../action/index'
import Toast from 'react-native-easy-toast'
import TrendingItem from "../common/TrendingItem";
import TrendingDialog, {TimeSpans} from '../common/TrendingDialog';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import NavigationUtil from "../navigator/NavigationUtil";
import FavoriteDao from "../expand/dao/FavoriteDao";
import {FLAG_STORAGE} from "../expand/dao/DataStore";
import FavoriteUtil from "../common/FavoriteUtil";
import EventBus from "react-native-event-bus";
import EventTypes from "../util/EventTypes";

const EVENT_TYPE_TIME_SPAN_CHANGE = "EVENT_TYPE_TIME_SPAN_CHANGE";
const URL = 'https://github.com/trending/';
const favoriteDao = new FavoriteDao(FLAG_STORAGE.flag_trending);
type Props = {};

class TrendingPage extends Component<Props> {
    constructor(props) {
        super(props);
        this.tabNames = ['All', 'C', 'C#', 'PHP', 'JS']
        this.state = {
            timeSpan: TimeSpans[0],
        }
    }

    _genTabs() {
        const tabs = {};
        const {theme} = this.props;
        this.tabNames.forEach((item, index) => {
            tabs[`tab${index}`] = {
                screen: props => <TrendingTabPage {...props} timeSpan={this.state.timeSpan} tabLabel={item}
                                                  theme={theme}/>,
                navigationOptions: {
                    title: item
                }
            }
        })
        return tabs;
    }

    //自定义Bar中间标题View
    renderTitleView() {
        return <View>
            <TouchableOpacity
                underlayColor='transparent'
                onPress={() => this.dialog.show()}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={{
                        fontSize: 18,
                        color: '#FFFFFF',
                        fontWeight: '400'
                    }}>趋势 {this.state.timeSpan.showText}</Text>
                    <MaterialIcons
                        name={'arrow-drop-down'}
                        size={22}
                        style={{color: 'white'}}
                    />
                </View>
            </TouchableOpacity>
        </View>
    }

    onSelectTimeSpan(tab) {
        this.dialog.dismiss();
        this.setState({
            timeSpan: tab,
        });
        DeviceEventEmitter.emit(EVENT_TYPE_TIME_SPAN_CHANGE, tab)
    }

    renderTrendingDialog() {
        return <TrendingDialog
            ref={dialog => this.dialog = dialog}
            onSelect={tab => this.onSelectTimeSpan(tab)}
        >

        </TrendingDialog>
    }

    _TabNav() {
        const {theme} = this.props;
        //注意：主题发生变化需要重新渲染top tab
        if (theme !== this.theme || !this.tabNav) {//优化效率：根据需要选择是否重新创建建TabNavigator，通常tab改变后才重新创建
            this.theme = theme;
            this.tabNav = createAppContainer(createMaterialTopTabNavigator(
                this._genTabs(), {
                    tabBarOptions: {
                        //设置顶部导航栏样式
                        tabStyle: styles.tabStyle,
                        upperCaseLabel: false,//是否使标签大写，默认为true
                        scrollEnabled: true,//是否支持 选项卡滚动，默认false
                        style: {
                            backgroundColor: theme.themeColor,
                            height: 30,//fix 开启scrollEnabled后再Android上初次加载时闪烁问题
                        },
                        indicatorStyle: styles.indicatorStyle,//标签指示器的样式
                        labelStyle: styles.labelStyle,//文字的样式

                    }, lazy: true//懒加载，一次只加载一个tab
                }
            ));
        }
        return this.tabNav;
    }

    render() {
        const {theme} = this.props;
        let statusBar = {
            backgroundColor: theme.themeColor,
            barStyle: "light-content",

        };
        let navigationBar = <NavigationBar
            titleView={this.renderTitleView()}
            statusBar={statusBar}
            style={theme.styles.navBar}
        />;
        let TopTabNavigator = this._TabNav();
        return (
            <View style={styles.container}>
                {navigationBar}
                <TopTabNavigator/>
                {this.renderTrendingDialog()}
            </View>
        );
    }
}

const mapTrendingStateToProps = state => ({
    // keys: state.language.languages,
    theme: state.theme.theme,
});
const mapTrendingDispatchToProps = dispatch => ({
    // onLoadLanguage: (flag) => dispatch(actions.onLoadLanguage(flag))
});
//注意：connect只是个function，并不应定非要放在export后面
export default connect(mapTrendingStateToProps, mapTrendingDispatchToProps)(TrendingPage);


const pageSize = 10;//设为常量，防止修改
class TrendingTab extends Component<Props> {
    constructor(props) {
        super(props)
        const {tabLabel, timeSpan} = this.props;
        this.storeName = tabLabel;
        this.timeSpan = timeSpan;
        this.isFavoriteChanged = false;
    }

    componentDidMount(): void {
        this.loadData(false);
        //接收引用
        this.timeSpanChangeListener = DeviceEventEmitter.addListener(EVENT_TYPE_TIME_SPAN_CHANGE, (timeSpan) => {
            this.timeSpan = timeSpan;
            this.loadData();
        });
        EventBus.getInstance().addListener(EventTypes.favoriteChanged_trending, this.favoriteChangeListener = () => {
            this.isFavoriteChanged = true;
        });
        EventBus.getInstance().addListener(EventTypes.bottom_tab_select, this.bottomTabSelectListener = (data) => {
            if (data.to === 1 && this.isFavoriteChanged) {
                this.loadData(null, true);
            }
        })
    }

    componentWillUnmount() {
        if (this.timeSpanChangeListener) {
            this.timeSpanChangeListener.remove();
        }
        EventBus.getInstance().removeListener(this.favoriteChangeListener);
        EventBus.getInstance().removeListener(this.bottomTabSelectListener);
    }

    /**
     * 获取数据
     */
    loadData(loadMore, refreshFavorite) {
        const {onRefreshTrending, onLoadMoreTrending, onFlushTrendingFavorite} = this.props;
        const store = this._store();

        const url = this.genFetchUrl(this.storeName);
        if (loadMore) {
            onLoadMoreTrending(this.storeName, ++store.pageIndex, pageSize, store.items, favoriteDao, callback => {
                this.refs.toast.show('没有更多了');
            })
        } else if (refreshFavorite) {
            onFlushTrendingFavorite(this.storeName, store.pageIndex, pageSize, store.items, favoriteDao);
            this.isFavoriteChanged = false;
        } else {
            onRefreshTrending(this.storeName, url, pageSize, favoriteDao)
        }

    }

    /**
     * 获取与当前页面有关的数据
     * @returns {*}
     * @private
     */
    _store() {
        const {trending} = this.props;
        let store = trending[this.storeName];
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
        return URL + key + '?' + this.timeSpan.searchText;
    }

    renderItem(data) {
        const item = data.item;
        const {theme} = this.props;
        return <TrendingItem
            projectModel={item}
            theme={theme}
            onSelect={(callback) => {
                NavigationUtil.goPage({
                    theme,
                    projectModel: item,
                    flag: FLAG_STORAGE.flag_trending,
                    callback,
                }, 'DetailPage')
            }}
            onFavorite={(item, isFavorite) => FavoriteUtil.onFavorite(favoriteDao, item, isFavorite, FLAG_STORAGE.flag_trending)}//点击收藏时回调

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
                    keyExtractor={item => "" + item.item.meta}
                    refreshControl={
                        <RefreshControl
                            title={'Loading'}
                            titleColor={theme.themeColor}
                            colors={[theme.themeColor]}
                            refreshing={store.isLoading}
                            onRefresh={() => this.loadData(false)}
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
    trending: state.trending
});
const mapDispatchToProps = dispatch => ({
    //将 dispatch(onRefreshPopular(storeName, url))绑定到props
    onRefreshTrending: (storeName, url, pageSize, favoriteDao) => dispatch(actions.onRefreshTrending(storeName, url, pageSize, favoriteDao)),
    onLoadMoreTrending: (storeName, pageIndex, pageSize, items, favoriteDao, callBack) => dispatch(actions.onLoadMoreTrending(storeName, pageIndex, pageSize, items, favoriteDao, callBack)),
    onFlushTrendingFavorite: (storeName, pageIndex, pageSize, items, favoriteDao) => dispatch(actions.onFlushTrendingFavorite(storeName, pageIndex, pageSize, items, favoriteDao)),
});
//注意：connect只是个function，并不应定非要放在export后面
const TrendingTabPage = connect(mapStateToProps, mapDispatchToProps)(TrendingTab);

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
