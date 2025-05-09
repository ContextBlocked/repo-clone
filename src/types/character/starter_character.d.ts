export type StarterCharacter = Model & {
	LeftLowerArm: MeshPart & {
		OriginalSize: Vector3Value;
		AvatarPartScaleType: StringValue;
		LeftElbowRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		LeftElbow: Motor6D;
		LeftLowerArmWrapTarget: WrapTarget;
		LeftWristRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
	};
	LeftFoot: MeshPart & {
		LeftFootWrapTarget: WrapTarget;
		OriginalSize: Vector3Value;
		AvatarPartScaleType: StringValue;
		LeftAnkle: Motor6D;
		LeftAnkleRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		LeftFootAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
	};
	RightHand: MeshPart & {
		RightGripAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		OriginalSize: Vector3Value;
		RightWristRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		RightWrist: Motor6D;
		AvatarPartScaleType: StringValue;
		RightHandWrapTarget: WrapTarget;
	};
	HumanoidRootPart: Part & {
		RootRigAttachment: Attachment;
		OriginalSize: Vector3Value;
	};
	RightLowerLeg: MeshPart & {
		RightAnkleRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		RightKnee: Motor6D;
		RightKneeRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		OriginalSize: Vector3Value;
		RightLowerLegWrapTarget: WrapTarget;
		AvatarPartScaleType: StringValue;
	};
	RightFoot: MeshPart & {
		RightFootWrapTarget: WrapTarget;
		RightAnkleRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		RightAnkle: Motor6D;
		OriginalSize: Vector3Value;
		RightFootAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		AvatarPartScaleType: StringValue;
	};
	LeftLowerLeg: MeshPart & {
		LeftKnee: Motor6D;
		OriginalSize: Vector3Value;
		LeftLowerLegWrapTarget: WrapTarget;
		AvatarPartScaleType: StringValue;
		LeftAnkleRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		LeftKneeRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
	};
	LowerTorso: MeshPart & {
		LowerTorsoWrapTarget: WrapTarget;
		LeftHipRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		Root: Motor6D;
		OriginalSize: Vector3Value;
		AvatarPartScaleType: StringValue;
		RootRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		RightHipRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		WaistCenterAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		WaistBackAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		WaistRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		WaistFrontAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
	};
	Head: MeshPart & {
		HatAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		OriginalSize: Vector3Value;
		NeckRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		FaceFrontAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		FaceControls: FaceControls;
		AvatarPartScaleType: StringValue;
		HairAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		Neck: Motor6D;
		FaceCenterAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		HeadWrapTarget: WrapTarget;
	};
	UpperTorso: MeshPart & {
		RightCollarAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		BodyBackAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		NeckRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		LeftCollarAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		OriginalSize: Vector3Value;
		UpperTorsoWrapTarget: WrapTarget;
		AvatarPartScaleType: StringValue;
		Waist: Motor6D;
		RightShoulderRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		BodyFrontAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		WaistRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		LeftShoulderRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		NeckAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
	};
	LeftUpperArm: MeshPart & {
		LeftShoulderRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		LeftUpperArmWrapTarget: WrapTarget;
		LeftShoulderAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		LeftElbowRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		OriginalSize: Vector3Value;
		LeftShoulder: Motor6D;
		AvatarPartScaleType: StringValue;
	};
	RightLowerArm: MeshPart & {
		OriginalSize: Vector3Value;
		RightLowerArmWrapTarget: WrapTarget;
		RightWristRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		RightElbowRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		RightElbow: Motor6D;
		AvatarPartScaleType: StringValue;
	};
	LeftHand: MeshPart & {
		OriginalSize: Vector3Value;
		AvatarPartScaleType: StringValue;
		LeftWrist: Motor6D;
		LeftGripAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		LeftHandWrapTarget: WrapTarget;
		LeftWristRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
	};
	Humanoid: Humanoid & {
		BodyTypeScale: NumberValue;
		BodyProportionScale: NumberValue;
		HeadScale: NumberValue;
		BodyWidthScale: NumberValue;
		BodyDepthScale: NumberValue;
		BodyHeightScale: NumberValue;
		Animator: Animator;
	};
	InitialPoses: Folder & {
		LeftUpperLeg_Composited: CFrameValue;
		LeftUpperLeg_Initial: CFrameValue;
		RightLowerLeg_Initial: CFrameValue;
		LeftFoot_Original: CFrameValue;
		LeftUpperLeg_Original: CFrameValue;
		Armature_Initial: CFrameValue;
		LeftHand_Composited: CFrameValue;
		RightLowerArm_Initial: CFrameValue;
		RightFoot_Original: CFrameValue;
		RightUpperArm_Initial: CFrameValue;
		Armature_Original: CFrameValue;
		UpperTorso_Composited: CFrameValue;
		RightHand_Original: CFrameValue;
		LeftLowerLeg_Composited: CFrameValue;
		RightHand_Initial: CFrameValue;
		UpperTorso_Original: CFrameValue;
		LeftUpperArm_Original: CFrameValue;
		LeftFoot_Initial: CFrameValue;
		LeftLowerArm_Original: CFrameValue;
		RightUpperArm_Composited: CFrameValue;
		LeftHand_Original: CFrameValue;
		RightFoot_Composited: CFrameValue;
		UpperTorso_Initial: CFrameValue;
		Head_Initial: CFrameValue;
		RightFoot_Initial: CFrameValue;
		RightLowerLeg_Original: CFrameValue;
		LeftUpperArm_Composited: CFrameValue;
		RightUpperLeg_Initial: CFrameValue;
		RightHand_Composited: CFrameValue;
		LeftUpperArm_Initial: CFrameValue;
		Armature_Composited: CFrameValue;
		RightUpperLeg_Original: CFrameValue;
		LowerTorso_Initial: CFrameValue;
		LowerTorso_Composited: CFrameValue;
		RightUpperLeg_Composited: CFrameValue;
		LeftLowerArm_Composited: CFrameValue;
		Head_Composited: CFrameValue;
		LeftLowerLeg_Original: CFrameValue;
		Head_Original: CFrameValue;
		LeftLowerArm_Initial: CFrameValue;
		LowerTorso_Original: CFrameValue;
		LeftLowerLeg_Initial: CFrameValue;
		RightUpperArm_Original: CFrameValue;
		RightLowerLeg_Composited: CFrameValue;
		RightLowerArm_Composited: CFrameValue;
		RightLowerArm_Original: CFrameValue;
		LeftHand_Initial: CFrameValue;
		LeftFoot_Composited: CFrameValue;
	};
	RightUpperArm: MeshPart & {
		OriginalSize: Vector3Value;
		RightUpperArmWrapTarget: WrapTarget;
		RightElbowRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		RightShoulder: Motor6D;
		RightShoulderRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		RightShoulderAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		AvatarPartScaleType: StringValue;
	};
	RightUpperLeg: MeshPart & {
		RightHip: Motor6D;
		RightHipRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		RightUpperLegWrapTarget: WrapTarget;
		OriginalSize: Vector3Value;
		RightKneeRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		AvatarPartScaleType: StringValue;
	};
	LeftUpperLeg: MeshPart & {
		LeftUpperLegWrapTarget: WrapTarget;
		LeftHipRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
		AvatarPartScaleType: StringValue;
		LeftHip: Motor6D;
		OriginalSize: Vector3Value;
		LeftKneeRigAttachment: Attachment & {
			OriginalPosition: Vector3Value;
		};
	};
};
