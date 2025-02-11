import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { Layout, Icon, message, notification } from "antd";
import DocumentTitle from "react-document-title";
import { connect } from "dva";
import { Route, Redirect, Switch, routerRedux } from "dva/router";
import { ContainerQuery } from "react-container-query";
import classNames from "classnames";
import { enquireScreen } from "enquire-js";
import GlobalHeader from "../components/GlobalHeader";
import SiderMenu from "../components/SiderMenu";
import NotFound from "../routes/Exception/404";
import { getRoutes } from "../utils/utils";
import userUtil from "../utils/user";
import globalUtil from "../utils/global";
import configureGlobal from "../utils/configureGlobal";
import cookie from "../utils/cookie";
import Authorized from "../utils/Authorized";
import { getMenuData } from "../common/menu";
import logo from "../../public/logo.png";
import OpenRegion from "../components/OpenRegion";
import CreateTeam from "../components/CreateTeam";
import JoinTeam from "../components/JoinTeam";
import Loading from "../components/Loading";
import ChangePassword from "../components/ChangePassword";
import AuthCompany from "../components/AuthCompany";

import CheckUserInfo from "./CheckUserInfo";
import InitTeamAndRegionData from "./InitTeamAndRegionData";
import PayTip from "./PayTip";
import MemoryTip from "./MemoryTip";
import PayMoneyTip from "./PayMoneyTip";
import Meiqia from "./Meiqia";

const qs = require("query-string");
const { Content } = Layout;
const { AuthorizedRoute } = Authorized;

const query = {
  "screen-xs": {
    maxWidth: 575
  },
  "screen-sm": {
    minWidth: 576,
    maxWidth: 767
  },
  "screen-md": {
    minWidth: 768,
    maxWidth: 991
  },
  "screen-lg": {
    minWidth: 992,
    maxWidth: 1199
  },
  "screen-xl": {
    minWidth: 1200
  }
};

let isMobile;
enquireScreen(b => {
  isMobile = b;
});

class BasicLayout extends React.PureComponent {
  static childContextTypes = {
    location: PropTypes.object,
    breadcrumbNameMap: PropTypes.object,
    currRegion: PropTypes.string,
    currTeam: PropTypes.string
  };
  state = {
    isMobile,
    isInit: false,
    openRegion: false,
    createTeam: false,
    joinTeam: false,
    showChangePassword: false,
    showWelcomeCreateTeam: false,
    canCancelOpenRegion: true,
    market_info: "",
    showAuthCompany: false
  };
  componentDidMount() {
    enquireScreen(mobile => {
      this.setState({ isMobile: mobile });
    });
    this.fetchUserInfo();
    this.setState({ showAuthCompany: this.props.showAuthCompany });
    var query = qs.parse(this.props.location.search);
    if (query && query.market_info) {
      this.setState({ market_info: query.market_info });
      this.setState({ showAuthCompany: true });
    }
  }
  onOpenRegion = () => {
    this.setState({ openRegion: true });
  };
  cancelOpenRegion = () => {
    this.setState({ openRegion: false, canCancelOpenRegion: true });
  };
  onCreateTeam = () => {
    this.setState({ createTeam: true });
  };
  cancelCreateTeam = () => {
    this.setState({ createTeam: false });
  };
  handleCreateTeam = values => {
    this.props.dispatch({
      type: "teamControl/createTeam",
      payload: values,
      callback: () => {
        notification.success({ message: "添加成功" });
        this.cancelCreateTeam();
        this.props.dispatch({ type: "user/fetchCurrent" });
      }
    });
  };
  onJoinTeam = () => {
    this.setState({ joinTeam: true });
  };
  cancelJoinTeam = () => {
    this.setState({ joinTeam: false });
  };
  handleJoinTeam = values => {
    this.props.dispatch({
      type: "global/joinTeam",
      payload: values,
      callback: () => {
        notification.success({ message: "申请成功，请等待审核" });
        this.cancelJoinTeam();
      }
    });
  };
  getChildContext() {
    const { location, routerData } = this.props;
    return { location, breadcrumbNameMap: routerData };
  }

  fetchUserInfo = () => {
    // 获取用户信息、保存团队和数据中心信息
    this.props.dispatch({
      type: "user/fetchCurrent",
      callback: () => {
        const load = document.querySelector("#load");
        if (load) {
          load.style.display = "none";
        }
      },
      handleError: res => {
        if (res && (res.status === 403 || res.status === 404)) {
          cookie.remove("token");
          cookie.remove("token", { domain: "" });
          cookie.remove("newbie_guide");
          cookie.remove("platform_url");
          location.reload();
        }
      }
    });
  };
  getPageTitle() {
    const { routerData, location, rainbondInfo } = this.props;
    const { pathname } = location;
    let title =
      (rainbondInfo &&
        rainbondInfo.title !== undefined &&
        rainbondInfo.title) ||
      "Rainbond | Serverless PaaS , A new generation of easy-to-use cloud management platforms based on kubernetes.";
    if (routerData[pathname] && routerData[pathname].name) {
      title = `${routerData[pathname].name} - ${title}`;
    }
    return title;
  }
  getBashRedirect = () => {
    // According to the url parameter to redirect 这里是重定向的,重定向到 url 的 redirect 参数所示地址
    const urlParams = new URL(window.location.href);

    const redirect = urlParams.searchParams.get("redirect");
    // Remove the parameters in the url
    if (redirect) {
      urlParams.searchParams.delete("redirect");
      window.history.replaceState(null, "redirect", urlParams.href);
    } else {
      return "/index";
    }
    return redirect;
  };
  handleMenuCollapse = collapsed => {
    this.props.dispatch({
      type: "global/changeLayoutCollapsed",
      payload: collapsed
    });
  };
  handleNoticeClear = type => {
    message.success(`清空了${type}`);
    this.props.dispatch({ type: "global/clearNotices", payload: type });
  };
  handleMenuClick = ({ key }) => {
    if (key === "cpw") {
      this.showChangePass();
    }
    if (key === "logout") {
      this.props.dispatch({ type: "user/logout" });
    }
  };
  handleNoticeVisibleChange = visible => {
    if (visible) {
      this.props.dispatch({ type: "global/fetchNotices" });
    }
  };
  handleTeamClick = ({ key }) => {
    if (key === "createTeam") {
      this.onCreateTeam();
      return;
    }
    if (key === "joinTeam") {
      this.onJoinTeam();
      return;
    }

    cookie.set("team", key);
    const currentUser = this.props.currentUser;
    let currRegionName = globalUtil.getCurrRegionName();
    const currTeam = userUtil.getTeamByTeamName(currentUser, key);

    if (currTeam) {
      const regions = currTeam.region || [];
      if (!regions.length) {
        notification.warning({ message: "该团队下无可用数据中心!" });
        return;
      }
      const selectRegion = regions.filter(
        item => item.team_region_name === currRegionName
      )[0];
      const selectRegionName = selectRegion
        ? selectRegion.team_region_name
        : regions[0].team_region_name;
      currRegionName = selectRegionName;
    }
    this.props.dispatch(
      routerRedux.push(`/team/${key}/region/${currRegionName}/index`)
    );
    // location.reload();
  };

  handleRegionClick = ({ key }) => {
    if (key === "openRegion") {
      this.onOpenRegion();
      return;
    }
    this.props.dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${key}/index`
      )
    );
    // location.reload();
  };
  showChangePass = () => {
    this.setState({ showChangePassword: true });
  };
  cancelChangePass = () => {
    this.setState({ showChangePassword: false });
  };
  handleChangePass = vals => {
    this.props.dispatch({
      type: "user/changePass",
      payload: {
        ...vals
      },
      callback: () => {
        notification.success({ message: "修改成功，请重新登录" });
      }
    });
  };

  handleInitTeamOk = () => {
    this.setState({ showWelcomeCreateTeam: false });
    this.fetchUserInfo();
  };
  handleCurrTeamNoRegion = () => {
    this.setState({ openRegion: true, canCancelOpenRegion: false });
  };
  handleOpenRegion = regions => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "teamControl/openRegion",
      payload: {
        team_name,
        region_names: regions.join(",")
      },
      callback: () => {
        notification.success({ message: "开通成功" });
        this.cancelOpenRegion();
        this.props.dispatch({
          type: "user/fetchCurrent",
          callback: () => {
            this.props.dispatch(
              routerRedux.replace(
                `/team/${team_name}/region/${regions[0]}/index`
              )
            );
          }
        });
      }
    });
  };
  render() {
    /**
     * 根据菜单取得重定向地址.
     */
    const redirectData = [];
    const getRedirect = item => {
      if (item && item.children) {
        if (item.children[0] && item.children[0].path) {
          redirectData.push({
            from: `/${item.path}`,
            to: `/${item.children[0].path}`
          });
          item.children.forEach(children => {
            getRedirect(children);
          });
        }
      }
    };
    getMenuData().forEach(getRedirect);

    const {
      currentUser,
      collapsed,
      fetchingNotices,
      notices,
      routerData,
      match,
      location,
      notifyCount,
      currTeam,
      currRegion,
      groups,
      nouse,
      rainbondInfo
    } = this.props;
    const bashRedirect = this.getBashRedirect();
    const layout = () => {
      const team = userUtil.getTeamByTeamName(
        currentUser,
        globalUtil.getCurrTeamName()
      );
      const hasRegion = !!(team.region && team.region.length);
      let region = null;
      let isRegionMaintain = false;
      if (hasRegion) {
        region =
          userUtil.hasTeamAndRegion(currentUser, currTeam, currRegion) || {};

        isRegionMaintain =
          region.region_status === "3" && !userUtil.isSystemAdmin(currentUser);
      }

      const renderContent = () => {
        // 当前团队没有数据中心
        if (!hasRegion) {
          return (
            <OpenRegion
              mode="card"
              onSubmit={this.handleOpenRegion}
              onCancel={this.cancelOpenRegion}
            />
          );
          return null;
        }

        // 数据中心维护中
        if (isRegionMaintain || nouse) {
          return (
            <div style={{ textAlign: "center", padding: "200px 0" }}>
              <Icon
                style={{ fontSize: 40, marginBottom: 32, color: "red" }}
                type="warning"
              />
              <h1
                style={{
                  fontSize: 40,
                  color: "rgba(0, 0, 0, 0.65)",
                  marginBottom: 20
                }}
              >
                {nouse ? "当前授权已过期" : "数据中心维护中"}
              </h1>
              <p
                style={{
                  fontSize: 20
                }}
              >
                {nouse
                  ? "请联系 010-64666786 获取更多商业服务。"
                  : "请稍后访问当前数据中心"}
              </p>
            </div>
          );
        }

        return (
          <Switch>
            {redirectData.map(item => (
              <Redirect key={item.from} exact from={item.from} to={item.to} />
            ))}
            {getRoutes(match.path, routerData).map(item => (
              <AuthorizedRoute
                key={item.key}
                path={item.path}
                component={item.component}
                exact={item.exact}
                authority={item.authority}
                logined
                redirectPath={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/exception/403`}
              />
            ))}

            <Redirect exact from="/" to={bashRedirect} />
            <Route render={NotFound} />
          </Switch>
        );
      };

      return (
        <Layout>
          {!isRegionMaintain && hasRegion && (
            <SiderMenu
              title={
                rainbondInfo &&
                rainbondInfo.title !== undefined &&
                rainbondInfo.title
              }
              currentUser={currentUser}
              logo={
                (rainbondInfo &&
                  rainbondInfo.logo !== undefined &&
                  rainbondInfo.logo) ||
                logo
              }
              Authorized={Authorized}
              menuData={getMenuData(groups)}
              collapsed={collapsed}
              location={location}
              isMobile={this.state.isMobile}
              onCollapse={this.handleMenuCollapse}
            />
          )}

          <Layout>
            <GlobalHeader
              logo={logo}
              isPubCloud={
                rainbondInfo &&
                rainbondInfo.is_public !== undefined &&
                rainbondInfo.is_public
              }
              notifyCount={notifyCount}
              currentUser={currentUser}
              fetchingNotices={fetchingNotices}
              notices={notices}
              collapsed={collapsed}
              isMobile={this.state.isMobile}
              onNoticeClear={this.handleNoticeClear}
              onCollapse={this.handleMenuCollapse}
              onMenuClick={this.handleMenuClick}
              onTeamClick={this.handleTeamClick}
              onRegionClick={this.handleRegionClick}
              onNoticeVisibleChange={this.handleNoticeVisibleChange}
              currTeam={currTeam}
              currRegion={currRegion}
            />
            <Content
              style={{
                margin: "24px 24px 0",
                height: "100%"
              }}
            >
              {renderContent()}
            </Content>
          </Layout>
        </Layout>
      );
    };

    return (
      <Fragment>
        <DocumentTitle title={this.getPageTitle()}>
          <CheckUserInfo
            rainbondInfo={rainbondInfo}
            onCurrTeamNoRegion={this.handleCurrTeamNoRegion}
            userInfo={currentUser}
            onInitTeamOk={this.handleInitTeamOk}
          >
            <InitTeamAndRegionData key={currTeam + currRegion}>
              <ContainerQuery query={query}>
                {params => <div className={classNames(params)}>{layout()}</div>}
              </ContainerQuery>
            </InitTeamAndRegionData>
          </CheckUserInfo>
        </DocumentTitle>
        {this.state.openRegion && (
          <OpenRegion
            onSubmit={this.handleOpenRegion}
            onCancel={this.cancelOpenRegion}
          />
        )}
        {this.state.createTeam && (
          <CreateTeam
            onOk={this.handleCreateTeam}
            onCancel={this.cancelCreateTeam}
          />
        )}
        {this.state.joinTeam && (
          <JoinTeam onOk={this.handleJoinTeam} onCancel={this.cancelJoinTeam} />
        )}
        {this.state.showChangePassword && (
          <ChangePassword
            onOk={this.handleChangePass}
            onCancel={this.cancelChangePass}
          />
        )}
        <Loading />
        {rainbondInfo &&
          rainbondInfo.is_public !== undefined &&
          rainbondInfo.is_public && <Meiqia />}
        {this.props.payTip && <PayTip dispatch={this.props.dispatch} />}
        {this.props.memoryTip && (
          <MemoryTip
            dispatch={this.props.dispatch}
            memoryTip={this.props.memoryTip}
          />
        )}
        {this.props.noMoneyTip && (
          <PayMoneyTip dispatch={this.props.dispatch} />
        )}
        {(this.props.showAuthCompany || this.state.showAuthCompany) && (
          <AuthCompany
            market_info={this.state.market_info}
            onOk={() => {
              this.setState({ showAuthCompany: false });
              var jumpPath = this.props.location.pathname;
              var query = this.props.location.search.replace(
                "market_info=" + this.state.market_info,
                ""
              );
              this.setState({ market_info: "" });
              this.props.dispatch(routerRedux.replace(jumpPath + query));
            }}
          />
        )}
      </Fragment>
    );
  }
}

export default connect(({ user, global, index, loading }) => ({
  currentUser: user.currentUser,
  notifyCount: user.notifyCount,
  collapsed: global.collapsed,
  groups: global.groups,
  fetchingNotices: loading.effects["global/fetchNotices"],
  notices: global.notices,
  currTeam: globalUtil.getCurrTeamName(),
  currRegion: globalUtil.getCurrRegionName(),
  rainbondInfo: global.rainbondInfo,
  payTip: global.payTip,
  memoryTip: global.memoryTip,
  noMoneyTip: global.noMoneyTip,
  showAuthCompany: global.showAuthCompany,
  overviewInfo: index.overviewInfo,
  nouse: global.nouse
}))(BasicLayout);
