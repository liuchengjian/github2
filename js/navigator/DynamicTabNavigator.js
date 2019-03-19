/**
 *动态导航器
 **/

import React, {Component} from 'react';
import {createBottomTabNavigator, createAppContainer} from "react-navigation";
import PopularPage from '../page/PopularPage';
import TrendingPage from '../page/TrendingPage';
import FavoritePage from '../page/FavoritePage';
import MyPage from '../page/MyPage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import NavigationUtil from "./NavigationUtil";
import {connect} from 'react-redux';
import {BottomTabBar} from 'react-navigation-tabs';
import EventBus from "react-native-event-bus";
import EventTypes from "../util/EventTypes";
// Navigation3x 必须使用createAppContainer包裹
const TABS = {//在这里配置页面的路由
    PopularPage: {
        screen: PopularPage,
        navigationOptions: {
            tabBarLabel: "最热",
            tabBarIcon: ({tintColor, focused}) => (
                <MaterialIcons
                    name={'whatshot'}
                    size={26}
                    style={{color: tintColor}}
                />
            ),
        }
    },
    TrendingPage:
        {
            screen: TrendingPage,
            navigationOptions: {
                tabBarLabel: "趋势",
                tabBarIcon: ({tintColor, focused}) => (
                    <Ionicons
                        name={'md-trending-up'}
                        size={26}
                        style={{color: tintColor}}
                    />
                ),
            }
        }
    ,
    FavoritePage: {
        screen: FavoritePage,
        navigationOptions: {
            tabBarLabel: "收藏",
            tabBarIcon: ({tintColor, focused}) => (
                <MaterialIcons
                    name={'favorite'}
                    size={26}
                    style={{color: tintColor}}
                />
            ),
        }
    }
    ,
    MyPage: {
        screen: MyPage,
        navigationOptions: {
            tabBarLabel: "我的",
            tabBarIcon: ({tintColor, focused}) => (
                <Entypo
                    name={'user'}
                    size={26}
                    style={{color: tintColor}}
                />
            ),
        }
    }
};

class TabBarComponent extends React.Component {
    constructor(props) {
        super(props);
        this.theme = {
            tintColor: props.activeTintColor,
            updateTime: new Date().getTime(),//标志位，已时间为标志位
        }
    }
    render(): React.ReactNode {
        //原
        // const {routes,index} = this.props.navigation.state;
        // if(routes[index].params){
        //     const {theme}=routes[index].params;
        //     //已当前时间为主
        //     if(theme &&theme.updateTime > this.theme.updateTime){
        //         this.theme = theme;
        //     }
        // }
        return <BottomTabBar
            {...this.props}
            //原 this.theme.tintColor||this.props.activeTintColor
            activeTintColor={this.props.theme.themeColor}
        />;
    }
}
class DynamicTabNavigator extends Component<Props> {
    constructor(props) {
        super(props);
        console.disableYellowBox = true;//去掉警告弹框
    }

    _tabNavigator() {
        if(this.Tabs){
            //解决点击改变颜色时Tabs切换到第一个
            return this.Tabs;
        }

        const {PopularPage, TrendingPage, FavoritePage, MyPage} = TABS;
        const tabs = {PopularPage, TrendingPage, FavoritePage, MyPage};//根据需要定制显示的tab
        // PopularPage.navigationOptions.tabBarLabel = '最热';//动态配置Tab属性
        return this.Tabs=createAppContainer(createBottomTabNavigator(tabs,{
            tabBarComponent:props=>{
                return <TabBarComponent theme={this.props.theme} {...props}/>
            }//更改底部样式
        }))//
    }

    render(): React.ReactNode {
        const Tab = this._tabNavigator();
        return <Tab

            onNavigationStateChange={(prevState, newState, action) => {
                //底部tab切换状态
                EventBus.getInstance().fireEvent(EventTypes.bottom_tab_select, {//发送底部tab切换的事件
                    from: prevState.index,
                    to: newState.index
                })
            }}
        />;
    }
}

const mapStateToProps = state => ({
    theme: state.theme.theme,
});

export default connect(mapStateToProps)(DynamicTabNavigator);
