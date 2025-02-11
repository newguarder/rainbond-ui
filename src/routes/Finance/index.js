import React, { PureComponent } from "react";
import moment from "moment";
import { connect } from "dva";
import { routerRedux, Link } from "dva/router";
import { Card, Row, Col, DatePicker, notification, Button, Radio} from "antd";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import styles from "../List/BasicList.less";
import globalUtil from "../../utils/global";
import TeamListTable from "../../components/tables/TeamListTable";
import userUtil from "../../utils/user";
import teamUtil from "../../utils/team";
import ScrollerX from "../../components/ScrollerX";
import CreateTeam from "../../components/CreateTeam";
import rainbond from "../../utils/rainbond";
import DescriptionList from "../../components/DescriptionList";
import CreatUser from "../../components/CreatUserForm";

const { Description } = DescriptionList;
const RadioGroup = Radio.Group;

@connect(({
  user, list, loading, global,index
}) => ({
  user: user.currentUser,
  list,
  loading: loading.models.list,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  isRegist: global.isRegist,
  overviewInfo: index.overviewInfo
}))
export default class BasicList extends PureComponent {
  constructor(props) {
    super(props);
    const params = this.getParam();
    // const isPublic = this.props.rainbondInfo && this.props.rainbondInfo.is_public;
    const { user } = this.props;
    const adminer = userUtil.isSystemAdmin(user) || userUtil.isCompanyAdmin(user);
    this.state = {
      date: moment(new Date().getTime()).format("YYYY-MM-DD"),
      companyInfo: {},
      list: [],
      datalist: [],
      showPayHistory: false,
      showConsumeDetail: false,
      // isPublic,
      scope: params.type || this.getDefaultScope(),
      teamList: [],
      teamsPage: 1,
      teamsPageSize: 8,
      showAddTeam: false,
      adminer,
      userVisible:false
    };
  }
  componentDidMount() {
    this.props.dispatch({
      type: "global/getIsRegist",
      callback: () => {},
    });
    this.props.dispatch({
      type: "global/getEnterpriseInfo",
      payload:{
        team_name:globalUtil.getCurrTeamName()
      },
      callback: () => {},
    });
    this.loadTeams();
  }
  onDelTeam = (teamName) => {
    this.props.dispatch({
      type: "teamControl/delTeam",
      payload: {
        team_name: teamName,
      },
      callback: () => {
        this.loadTeams();
      },
    });
  };
  onAddTeam = () => {
    this.setState({ showAddTeam: true });
  };
  onRegistChange = (e) => {
    this.props.dispatch({
      type: "global/putIsRegist",
      payload: {
        isRegist: e.target.value,
      },
      callback: () => {},
    });
  };
  getDefaultScope() {
    // if (this.props.rainbondInfo && this.props.rainbondInfo.is_public) {
    //   return "finance";
    // }
    return "manage";
  }
  getParam() {
    return this.props.match.params;
  }
  getCompanyInfo = () => {
    this.props.dispatch({
      type: "global/getCompanyInfo",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        enterprise_id: this.props.user.enterprise_id,
      },
      callback: (data) => {
        if(data){
          this.setState({ companyInfo: data.bean });
        }
      },
    });
  };
 
  handleCreateTeam = (values) => {
    this.props.dispatch({
      type: "teamControl/createTeam",
      payload: values,
      callback: () => {
        notification.success({ message: "添加成功" });
        this.cancelCreateTeam();
        this.props.dispatch({ type: "user/fetchCurrent" });
        //添加完查询企业团队列表
        this.loadTeams();
      },
    });
  };
  cancelCreateTeam = () => {
    this.setState({ showAddTeam: false });
  };
  showConsumeDetail = () => {
    this.setState({ showConsumeDetail: true });
  };
  hideConsumeDetail = () => {
    this.setState({ showConsumeDetail: false });
  };
  showPayHistory = () => {
    this.setState({ showPayHistory: true });
  };
  hidePayHistory = () => {
    this.setState({ showPayHistory: false });
  };
  handleTabChange = (key) => {
    this.setState({ scope: key });
  };
 
  hanldePageChange = (page) => {
    this.setState(
      {
        teamsPage: page,
      },
      () => {
        this.loadTeams();
      },
    );
  };
  loadTeams = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "global/getEnterpriseTeams",
      payload: {
        enterprise_id: this.props.user.enterprise_id,
        page_size: this.state.teamsPageSize,
        page_num: this.state.teamsPage,
        team_name: globalUtil.getCurrTeamName()
      },
      callback: (data) => {
        if(data){
          this.setState({
            teamList: data.list || [],
            teamsTotal: data.total,
          });
        }
      },
    });
  };
 

  handelUnderstand = () => {
    window.open("https://www.goodrain.com/industrycloud");
  };
  handelObtain = () => {
    window.open("https://t.goodrain.com/");
  };
  getSettingShow = () => {
    if (!this.props.is_public) {
      return (
        <Card
          style={{
            marginBottom: 24,
          }}
          bodyStyle={{
            paddingTop: 12,
          }}
          bordered={false}
          title="平台设置"
        >
          <DescriptionList col="1" size="large" style={{ marginBottom: 32, marginTop: 32 }}>
            <Description term="用户注册">
              <RadioGroup onChange={this.onRegistChange} value={this.props.isRegist}>
                <Radio value>允许注册</Radio>
                <Radio value={false}>禁止注册</Radio>
              </RadioGroup>
              <Button size="small" type="primary" onClick={this.addUser} style={{float:"right"}}>添加用户</Button>
            </Description>
          </DescriptionList>
        </Card>
      );
    }
  };
  manage = () => {
    const pagination = {
      current: this.state.teamsPage,
      pageSize: this.state.teamsPageSize,
      total: this.state.teamsTotal,
      onChange: (v) => {
        this.hanldePageChange(v);
      },
    };
    return (
      <div>
        <Card
          style={{
            marginBottom: 24,
          }}
          bodyStyle={{
            paddingTop: 12,
          }}
          bordered={false}
          title="企业信息"
        >
          <DescriptionList col="1" size="large" style={{ marginBottom: 32, marginTop: 32 }}>
            <Description term="企业名称">
              {this.props.enterprise && this.props.enterprise.enterprise_alias}
            </Description>
            <Description term="联合云ID">
              {this.props.enterprise && this.props.enterprise.enterprise_id}
            </Description>
            <Description term="创建时间">
              {this.props.enterprise && this.props.enterprise.create_time}
            </Description>
            <Description term="平台版本">
              {this.props.rainbondInfo.version || "V3.7.1-release"}
              <Button type="primary" style={{ marginLeft: 16 }} onClick={this.handelUnderstand}>
                了解企业解决方案
              </Button>
              <Button style={{ marginLeft: 16 }} onClick={this.handelObtain}>
                开源社区
              </Button>
            </Description>
          </DescriptionList>
        </Card>
        {this.state.adminer && (
          <div>
            {this.getSettingShow()}
            <Card
              style={{
                marginBottom: 24,
              }}
              bodyStyle={{
                paddingTop: 12,
              }}
              bordered={false}
              title="企业团队列表"
              extra={
                <a href="javascript:;" onClick={this.onAddTeam}>
                  添加团队
                </a>
              }
            >
              <ScrollerX sm={600}>
                <TeamListTable
                  pagination={pagination}
                  onDelete={this.onDelTeam}
                  onChange={this.onChange}
                  list={this.state.teamList}
                />
              </ScrollerX>
            </Card>
          </div>
        )}
      </div>
    );
  };

  renderContent = () => {
    const { user } = this.props;
    if (this.state.scope === "manage") {
      return this.manage();
    }
    // 不是系统管理员
    if (!userUtil.isSystemAdmin(user) && !userUtil.isCompanyAdmin(user)) {
      this.props.dispatch(routerRedux.replace(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/Exception/403`));
      return null;
    }
  };
  //管理员添加用户
  addUser=()=>{
    this.setState({
      userVisible: true,
    });
  }
  handleCreatUser=(values)=>{
    this.props.dispatch({
      type:"global/creatUser",
      payload:{
        ...values
      },
      callback:(data)=>{
        if(data&&data._condition==200){
          notification.success({ message: data.msg_show});
        }else{
          notification.error({ message: data.msg_show });
        }
        // console.log(data)
      }
    })
    this.cancelCreatUser();
  }
  cancelCreatUser = () => {
    this.setState({
      userVisible: false,
    });
  }
  render() {
    const {userVisible} = this.state;
    const pageHeaderContent = (
      <div className={styles.pageHeaderContent}>
        <div className={styles.content}>
          <div>企业管理员可以设置平台信息，管理企业下的团队</div>
        </div>
      </div>
    );

    let tabList = [
      {
        key: "manage",
        tab: "管理",
      },
    ];
    return (
      <PageHeaderLayout
        tabList={tabList}
        tabActiveKey={this.state.scope}
        onTabChange={this.handleTabChange}
        content={pageHeaderContent}
      >
        {this.renderContent()}
        {this.state.showAddTeam && (
          <CreateTeam onOk={this.handleCreateTeam} onCancel={this.cancelCreateTeam} />
        )}
        {userVisible && <CreatUser onOk={this.handleCreatUser} onCancel={this.cancelCreatUser}/>}
      </PageHeaderLayout>
    );
  }
}
