import React, {Component} from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View,} from 'react-native'
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import HTMLView from 'react-native-htmlview';
import {PropTypes} from 'prop-types';
export default class BaseItem extends Component{
    //类型检查
    static propTypes = {
        projectModel: PropTypes.object,
        onSelect: PropTypes.func,//点击时
        onFavorite: PropTypes.func,//收藏
    };
    constructor(props){
        super(props);
        this.state={
            isFavorite: this.props.projectModel.isFavorite,
        }
    }

    /**
     * 发生变化时，会调用这个方法
     * 牢记：https://github.com/reactjs/rfcs/blob/master/text/0006-static-lifecycle-methods.md
     * componentWillReceiveProps在新版React中不能再用了
     * @param nextProps
     * @param prevState
     * @returns {*}
     */
    static getDerivedStateFromProps(nextProps, prevState) {
        const isFavorite = nextProps.projectModel.isFavorite;//变化后的收藏状态
        if (prevState.isFavorite !== isFavorite) {//如果发生变化
            return {
                isFavorite: isFavorite,
            };
        }
        return null;
    }
    //保存收藏状态
    setFavoriteState(isFavorite){
        this.props.projectModel.isFavorite = isFavorite;
        this.setState({
            isFavorite: isFavorite,
        })
    }
    //点击时改变收藏状态
    onPressFavorite(){
        this.setFavoriteState(!this.state.isFavorite);
        this.props.onFavorite(this.props.projectModel.item, !this.state.isFavorite);//更改收藏状态，进行取反

    }

    onItemClick() {
        this.props.onSelect(isFavorite => {
            this.setFavoriteState(isFavorite);
        });
    }
    _favoriteIcon() {
        const {theme} = this.props;
        return <TouchableOpacity
            style={{padding: 6}}
            underlayColor='transparent'
            onPress={() => this.onPressFavorite()}>
            <FontAwesome
                name={this.state.isFavorite ? 'star' : 'star-o'}
                size={26}
                style={{color: theme.themeColor}}
            />
        </TouchableOpacity>
    }

}